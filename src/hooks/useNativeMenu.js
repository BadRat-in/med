import { useEffect, useRef } from "react";
import {
  Menu as TauriMenu,
  MenuItem,
  Submenu,
  PredefinedMenuItem,
} from "@tauri-apps/api/menu";
import { basename } from "../lib/paths";

/**
 * Builds the native app menu. Actions are read from handlersRef.current
 * so the menu never holds stale closures.
 */
export function useNativeMenu(handlersRef, recent) {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const h = () => handlersRef.current;

        const recentItems =
          !(h().recent || []).length
            ? [
                await MenuItem.new({
                  id: "recent-empty",
                  text: "No Recent Files",
                  enabled: false,
                }),
              ]
            : [
                ...(await Promise.all(
                  h().recent.slice(0, 10).map(async (item, i) => {
                    const path = typeof item === "string" ? item : item.path;
                    return MenuItem.new({
                      id: `recent-${i}`,
                      text: basename(path),
                      action: () => h().handleOpenRecent(path),
                    });
                  })
                )),
                await PredefinedMenuItem.new({ item: "Separator" }),
                await MenuItem.new({
                  id: "clear-recent",
                  text: "Clear Recent",
                  action: () => h().clearRecent(),
                }),
              ];

        const appSub = await Submenu.new({
          text: "MED",
          items: [
            await MenuItem.new({
              id: "about",
              text: "About MED",
              action: () => h().setAboutOpen(true),
            }),
            await PredefinedMenuItem.new({ item: "Separator" }),
            await PredefinedMenuItem.new({ item: "Hide" }),
            await PredefinedMenuItem.new({ item: "HideOthers" }),
            await PredefinedMenuItem.new({ item: "ShowAll" }),
            await PredefinedMenuItem.new({ item: "Separator" }),
            await PredefinedMenuItem.new({ item: "Quit" }),
          ],
        });

        const fileSub = await Submenu.new({
          text: "File",
          items: [
            await MenuItem.new({
              id: "new",
              text: "New",
              accelerator: "CmdOrCtrl+N",
              action: () => h().handleNew(),
            }),
            await MenuItem.new({
              id: "open",
              text: "Open…",
              accelerator: "CmdOrCtrl+O",
              action: () => h().handleOpen(),
            }),
            await Submenu.new({ text: "Open Recent", items: recentItems }),
            await PredefinedMenuItem.new({ item: "Separator" }),
            await MenuItem.new({
              id: "save",
              text: "Save",
              accelerator: "CmdOrCtrl+S",
              action: () => h().handleSave(),
            }),
            await MenuItem.new({
              id: "save-as",
              text: "Save As…",
              accelerator: "CmdOrCtrl+Shift+S",
              action: () => h().handleSaveAs(),
            }),
            await PredefinedMenuItem.new({ item: "Separator" }),
            await MenuItem.new({
              id: "close-tab",
              text: "Close Tab",
              accelerator: "CmdOrCtrl+W",
              action: () => {
                if (h().activeId) h().handleCloseTab(h().activeId);
              },
            }),
            await MenuItem.new({
              id: "home",
              text: "Home",
              action: () => h().handleGoHome(),
            }),
          ],
        });

        const editSub = await Submenu.new({
          text: "Edit",
          items: [
            await PredefinedMenuItem.new({ item: "Undo" }),
            await PredefinedMenuItem.new({ item: "Redo" }),
            await PredefinedMenuItem.new({ item: "Separator" }),
            await PredefinedMenuItem.new({ item: "Cut" }),
            await PredefinedMenuItem.new({ item: "Copy" }),
            await PredefinedMenuItem.new({ item: "Paste" }),
            await PredefinedMenuItem.new({ item: "SelectAll" }),
          ],
        });

        const viewSub = await Submenu.new({
          text: "View",
          items: [
            await MenuItem.new({
              id: "toggle-theme",
              text: "Toggle Light / Dark",
              accelerator: "CmdOrCtrl+Shift+L",
              action: () => h().toggleTheme(),
            }),
            await MenuItem.new({
              id: "toggle-live",
              text: "Toggle Live Preview",
              accelerator: "CmdOrCtrl+Shift+P",
              action: () => h().toggleLive(),
            }),
          ],
        });

        const menu = await TauriMenu.new({
          items: [appSub, fileSub, editSub, viewSub],
        });
        if (!cancelled) await menu.setAsAppMenu();
      } catch (e) {
        console.warn("Native menu setup failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [handlersRef, recent]);
}
