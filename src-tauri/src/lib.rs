#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

// Windows 壳层适配：托盘恢复/退出入口 + 主面板复用（等价 macOS 的 Dock 重开）。
#[cfg(target_os = "windows")]
mod windows_shell {
    use std::fmt::Write as _;
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

    // 诊断日志：%TEMP%\flowglass-widget.log。交叉构建的 Windows 包首次真机测试
    // 发现浮窗未显示，此日志用于定位：窗口缺失 / 隐藏 / 位置异常 / 渲染透明不可见。
    pub fn widget_log(app: &tauri::AppHandle, note: &str) {
        let mut line = String::new();
        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let _ = writeln!(line, "[unix {ts}] {note}");
        match app.get_webview_window("widget") {
            Some(w) => {
                let visible = w.is_visible().map(|v| v.to_string()).unwrap_or_else(|e| format!("err:{e}"));
                let pos = w.outer_position().map(|p| format!("{},{}", p.x, p.y)).unwrap_or_else(|e| format!("err:{e}"));
                let size = w.outer_size().map(|s| format!("{}x{}", s.width, s.height)).unwrap_or_else(|e| format!("err:{e}"));
                let _ = writeln!(line, "  widget: exists visible={visible} pos=({pos}) size={size}");
            }
            None => {
                let _ = writeln!(line, "  widget: MISSING");
            }
        }
        let path = std::env::temp_dir().join("flowglass-widget.log");
        let mut all = std::fs::read_to_string(&path).unwrap_or_default();
        all.push_str(&line);
        let _ = std::fs::write(&path, all);
    }

    // 浮窗恢复入口：存在则拉回可见并置顶；静态配置创建失败时按原参数程序化重建。
    pub fn show_widget(app: &tauri::AppHandle) {
        if let Some(w) = app.get_webview_window("widget") {
            let _ = w.show();
            let _ = w.set_always_on_top(true);
            let _ = w.set_focus();
        } else {
            let built = tauri::WebviewWindowBuilder::new(
                app,
                "widget",
                tauri::WebviewUrl::App(std::path::PathBuf::from("widget.html")),
            )
            .decorations(false)
            .transparent(true)
            .always_on_top(true)
            .resizable(false)
            .skip_taskbar(true)
            .shadow(false)
            .inner_size(240.0, 308.0)
            .position(100.0, 120.0)
            .build();
            match built {
                Ok(_) => widget_log(app, "widget recreated programmatically"),
                Err(e) => widget_log(app, &format!("widget recreate FAILED: {e}")),
            }
        }
        widget_log(app, "tray show-widget");
    }

    pub fn setup(app: &mut tauri::App) -> tauri::Result<()> {
        // 主窗口关闭为隐藏（见 on_window_event），Windows 没有 Dock：
        // 托盘菜单提供「显示主面板」与「退出」两个入口，左键托盘直接恢复主面板。
        let show = MenuItem::with_id(app, "show", "显示主面板", true, None::<&str>)?;
        let show_widget_item = MenuItem::with_id(app, "show_widget", "显示 Mini", true, None::<&str>)?;
        let quit = MenuItem::with_id(app, "quit", "退出 Flowglass", true, None::<&str>)?;
        let menu = Menu::with_items(app, &[&show, &show_widget_item, &quit])?;

        TrayIconBuilder::with_id("flowglass-tray")
            .tooltip("Flowglass")
            .icon(app.default_window_icon().cloned().expect("missing default icon"))
            .menu(&menu)
            .show_menu_on_left_click(false)
            .on_menu_event(|app, event| match event.id.as_ref() {
                "show" => show_main(app),
                "show_widget" => show_widget(app),
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

        // 静态配置未建出浮窗时立即尝试程序化重建，并记录窗口状态供真机诊断。
        if app.get_webview_window("widget").is_none() {
            show_widget(app.app_handle());
        }
        // 无论静态或程序化创建，统一按逻辑尺寸重设一次：个别 DPI 下建窗若按物理像素
        // 落位，240x308 物理窗口装不下 240x308 逻辑内容，表现为右上/左下/右下三角缺失。
        if let Some(widget) = app.get_webview_window("widget") {
            let _ = widget.set_size(tauri::LogicalSize::new(240.0, 308.0));
        }
        widget_log(app.app_handle(), "startup");
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
            // 浮窗跨不同缩放的显示器时，透明窗口物理表面与 WebView 布局可能不一致
            // 导致右/下方向裁切（2026-10-19 实机反馈“三个角缺失”）；重设逻辑尺寸强制重排。
            if window.label() == "widget" {
                if let tauri::WindowEvent::ScaleFactorChanged { .. } = event {
                    let _ = window.set_size(tauri::LogicalSize::new(240.0, 308.0));
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
