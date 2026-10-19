#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

#[tauri::command]
fn double_click_interval_ms() -> u64 {
    #[cfg(target_os = "macos")]
    unsafe {
        let interval: f64 = msg_send![class!(NSEvent), doubleClickInterval];
        return (interval * 1000.0).ceil() as u64;
    }
    #[cfg(not(target_os = "macos"))]
    { 500 }
}

// Mini 右键菜单「打开主页面」：恢复并聚焦主面板（隐藏/最小化后也能找回）。
#[tauri::command]
fn show_main_panel(app: tauri::AppHandle) {
    use tauri::Manager;
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            double_click_interval_ms,
            show_main_panel
        ])
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
            Ok(())
        })
        .on_window_event(|window, event| {
            // 主窗口关闭保留 WebView 与计时，Dock 重开时恢复。
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building Flowglass")
        .run(|app, event| {
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = event {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        });
}
