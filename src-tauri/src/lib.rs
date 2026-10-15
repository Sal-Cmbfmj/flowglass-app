#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

// Windows 壳层适配：托盘恢复/退出入口 + 主面板复用（等价 macOS 的 Dock 重开）。
#[cfg(target_os = "windows")]
mod windows_shell {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
    use tauri::Manager;

    pub fn show_main(app: &tauri::AppHandle) {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }

    pub fn setup(app: &mut tauri::App) -> tauri::Result<()> {
        // 主窗口关闭为隐藏（见 on_window_event），Windows 没有 Dock：
        // 托盘菜单提供「显示主面板」与「退出」两个入口，左键托盘直接恢复主面板。
        let show = MenuItem::with_id(app, "show", "显示主面板", true, None::<&str>)?;
        let quit = MenuItem::with_id(app, "quit", "退出 Flowglass", true, None::<&str>)?;
        let menu = Menu::with_items(app, &[&show, &quit])?;

        TrayIconBuilder::with_id("flowglass-tray")
            .tooltip("Flowglass")
            .icon(app.default_window_icon().cloned().expect("missing default icon"))
            .menu(&menu)
            .show_menu_on_left_click(false)
            .on_menu_event(|app, event| match event.id.as_ref() {
                "show" => show_main(app),
                "quit" => app.exit(0),
                _ => {}
            })
            .on_tray_icon_event(|tray, event| {
                if let TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } = event
                {
                    show_main(tray.app_handle());
                }
            })
            .build(app)?;
        Ok(())
    }
}

#[tauri::command]
fn double_click_interval_ms() -> u64 {
    #[cfg(target_os = "macos")]
    unsafe {
        let interval: f64 = msg_send![class!(NSEvent), doubleClickInterval];
        return (interval * 1000.0).ceil() as u64;
    }
    // Windows：读取系统双击识别时长（设置 → 蓝牙和其他设备 → 鼠标 → 双击速度）。
    #[cfg(target_os = "windows")]
    {
        unsafe { return windows_sys::Win32::UI::Input::KeyboardAndMouse::GetDoubleClickTime() as u64; }
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    { 500 }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![double_click_interval_ms])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                use tauri::Manager;
                // 置顶挂件在非焦点状态下也要响应鼠标悬停：
                // macOS 默认不向非 key window 派发 mouseMoved，需打开 acceptsMouseMovedEvents。
                if let Some(webview_window) = app.get_webview_window("widget") {
                    if let Ok(ns_window) = webview_window.ns_window() {
                        unsafe {
                            let _: () = msg_send!(
                                ns_window as *mut objc::runtime::Object,
                                setAcceptsMouseMovedEvents: true
                            );
                        }
                    }
                }
            }
            #[cfg(target_os = "windows")]
            windows_shell::setup(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            // 主窗口关闭保留 WebView 与计时；macOS 由 Dock 重开，Windows 由托盘恢复。
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        });

    // Windows：二次启动不创建第二组窗口/第二份真值，聚焦既有实例并恢复主面板。
    #[cfg(target_os = "windows")]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        windows_shell::show_main(app);
    }));

    builder
        .build(tauri::generate_context!())
        .expect("error while building Flowglass")
        .run(|_app, _event| {
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = _event {
                use tauri::Manager;
                if let Some(window) = _app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        });
}
