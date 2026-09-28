import { AndroidDeviceState, Contact } from "../types";
import { ALL_ANDROID_APPS, findAndroidAppByName, resolveAppLaunchUrl } from "./allAppsService";

export function parseAndExecuteAndroidCommand(
  command: string,
  deviceState: AndroidDeviceState,
  contacts: Contact[] = []
): {
  handled: boolean;
  actionType: string;
  spokenResponse: string;
  payload?: any;
} {
  const lower = command.toLowerCase().trim();

  // 0. BACKGROUND EXECUTION / FLOATING OVERLAY COMMANDS
  if (
    lower.includes("background mode") ||
    lower.includes("background mein") ||
    lower.includes("background me") ||
    lower.includes("run in background") ||
    lower.includes("always on") ||
    lower.includes("background service")
  ) {
    const isOff = lower.includes("off") || lower.includes("band") || lower.includes("stop");
    return {
      handled: true,
      actionType: "background_toggle",
      spokenResponse: isOff
        ? "Background service ko standby par rakh diya gaya hai."
        : "Bilkul! Main ab background mein bhi lagatar run kar rahi hu. Aap koi bhi dusra Android app use kar sakte hain!",
      payload: { enable: !isOff },
    };
  }

  if (
    lower.includes("floating") ||
    lower.includes("pip") ||
    lower.includes("picture in picture") ||
    lower.includes("overlay")
  ) {
    return {
      handled: true,
      actionType: "floating_pip",
      spokenResponse: "Floating overlay window activate kar rahi hu taaki main har app ke upar dikhu.",
    };
  }

  // 0B. ALL APPS DRAWER / APP ACCESS
  if (
    lower === "all apps" ||
    lower === "apps" ||
    lower.includes("all app access") ||
    lower.includes("sara app") ||
    lower.includes("sare app") ||
    lower.includes("saare app") ||
    lower.includes("app drawer") ||
    lower.includes("apps kholo") ||
    lower.includes("phone ke apps")
  ) {
    return {
      handled: true,
      actionType: "all_apps_open",
      spokenResponse: `Aapke Android phone ke saare ${ALL_ANDROID_APPS.length} apps ka access active hai. App Drawer khol diya hai!`,
    };
  }

  // 1. FLASHLIGHT / TORCH
  if (
    lower.includes("torch on") ||
    lower.includes("torch jalao") ||
    lower.includes("flashlight on") ||
    lower.includes("flash on") ||
    lower.includes("batti jalao") ||
    lower.includes("turn on torch") ||
    lower.includes("turn on flashlight")
  ) {
    return {
      handled: true,
      actionType: "torch_toggle",
      spokenResponse: "Bilkul! Flashlight on kar di hai.",
      payload: { enable: true },
    };
  }

  if (
    lower.includes("torch off") ||
    lower.includes("torch band") ||
    lower.includes("flashlight off") ||
    lower.includes("flash off") ||
    lower.includes("batti bujhao") ||
    lower.includes("turn off torch") ||
    lower.includes("turn off flashlight")
  ) {
    return {
      handled: true,
      actionType: "torch_toggle",
      spokenResponse: "Flashlight band kar di gayi hai.",
      payload: { enable: false },
    };
  }

  if (lower.includes("screen torch") || lower.includes("screen flashlight") || lower.includes("white screen")) {
    return {
      handled: true,
      actionType: "screen_torch",
      spokenResponse: "Screen torch active kar di hai 100% white brightness par.",
      payload: { enable: true },
    };
  }

  // 2. BATTERY & POWER
  if (
    lower.includes("battery") ||
    lower.includes("charge") ||
    lower.includes("charging") ||
    lower.includes("kitna charge hai") ||
    lower.includes("battery percentage")
  ) {
    return {
      handled: true,
      actionType: "battery_check",
      spokenResponse: `Aapki Android battery ${deviceState.battery.level}% par hai aur health ${deviceState.battery.health} hai.`,
      payload: { level: deviceState.battery.level },
    };
  }

  if (lower.includes("power saver") || lower.includes("battery saver")) {
    const isEnable = !lower.includes("off") && !lower.includes("band");
    return {
      handled: true,
      actionType: "powersaver_toggle",
      spokenResponse: isEnable ? "Battery saver mode enable kar diya hai." : "Battery saver mode disable kar diya hai.",
      payload: { enable: isEnable },
    };
  }

  // 3. PHONE CALLS & DIALER
  const callMatch = lower.match(/^(?:call|dial|phone\s+lagao|call\s+karo)\s+(.+)$/i);
  if (callMatch) {
    const target = callMatch[1].trim();
    const contact = contacts.find(
      (c) => c.name.toLowerCase() === target.toLowerCase() || c.name.toLowerCase().includes(target.toLowerCase())
    );
    const phoneNumber = contact ? contact.phone : target;

    return {
      handled: true,
      actionType: "call",
      spokenResponse: `Calling ${contact ? contact.name : target} now.`,
      payload: { number: phoneNumber, name: contact?.name || target },
    };
  }

  if (lower === "dialer" || lower === "open dialer" || lower === "phone dialer" || lower === "dialer kholo") {
    return {
      handled: true,
      actionType: "call",
      spokenResponse: "Phone dialer khol rahi hu.",
      payload: {},
    };
  }

  // 4. SMS MESSAGING
  const smsMatch = lower.match(/^(?:send\s+sms|sms\s+bhejo|message\s+karo)\s+(?:to\s+)?(.+?)\s+(?:saying|ko|msg)\s+(.+)$/i);
  if (smsMatch) {
    const target = smsMatch[1].trim();
    const message = smsMatch[2].trim();
    const contact = contacts.find(
      (c) => c.name.toLowerCase() === target.toLowerCase() || c.name.toLowerCase().includes(target.toLowerCase())
    );
    const phone = contact ? contact.phone : target;

    return {
      handled: true,
      actionType: "sms",
      spokenResponse: `${contact ? contact.name : target} ke liye SMS compose kar diya hai: "${message}"`,
      payload: { number: phone, name: contact?.name || target, message },
    };
  }

  // 5. WHATSAPP MESSAGE
  const waMatch = lower.match(/(?:whatsapp|wa)\s+(?:message\s+)?(?:to\s+|pe\s+)?(.+?)\s+(?:saying|ko|likho|bhejo)\s+(.+)/i);
  if (waMatch) {
    const target = waMatch[1].trim();
    const message = waMatch[2].trim();
    const contact = contacts.find(
      (c) => c.name.toLowerCase() === target.toLowerCase() || c.name.toLowerCase().includes(target.toLowerCase())
    );
    const phone = contact ? contact.phone : target;

    return {
      handled: true,
      actionType: "whatsapp",
      spokenResponse: `${contact ? contact.name : target} ke liye WhatsApp message draft kar diya hai.`,
      payload: { number: phone, name: contact?.name || target, message },
    };
  }

  // 6. ALARMS & TIMERS
  const alarmMatch = lower.match(/(?:set\s+alarm|alarm\s+lagao|alarm\s+set\s+karo)\s+(?:for\s+|at\s+|subah\s+|shaam\s+|ko\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|baje)?)/i);
  if (alarmMatch) {
    const timeRaw = alarmMatch[1].trim();
    return {
      handled: true,
      actionType: "alarm_set",
      spokenResponse: `${timeRaw} ke liye alarm schedule kar diya hai.`,
      payload: { timeRaw },
    };
  }

  const timerMatch = lower.match(/(?:set\s+timer|timer\s+lagao|timer\s+start)\s+(?:for\s+)?(\d+)\s*(min|minute|sec|second|ghanta|hour)/i);
  if (timerMatch) {
    const amount = parseInt(timerMatch[1], 10);
    const unit = timerMatch[2].toLowerCase();
    let seconds = amount;
    if (unit.startsWith("min")) seconds = amount * 60;
    if (unit.startsWith("hour") || unit.startsWith("ghant")) seconds = amount * 3600;

    return {
      handled: true,
      actionType: "timer_set",
      spokenResponse: `${amount} ${unit} ka countdown timer start kar diya hai!`,
      payload: { seconds, label: `${amount} ${unit} Timer` },
    };
  }

  // 7. VIBRATION / HAPTICS
  if (lower.includes("vibrate") || lower.includes("vibration") || lower.includes("buzz") || lower.includes("phone hilao")) {
    return {
      handled: true,
      actionType: "vibrate",
      spokenResponse: "Android haptic vibration motor trigger ho gaya hai.",
      payload: { pattern: [200, 100, 200, 100, 400] },
    };
  }

  // 8. CAMERA & VISION
  if (
    lower.includes("camera") ||
    lower.includes("photo kheencho") ||
    lower.includes("selfie") ||
    lower.includes("camera kholo")
  ) {
    return {
      handled: true,
      actionType: "camera_open",
      spokenResponse: "Android 4K camera viewfinder open kar diya hai.",
    };
  }

  // 9. LOCATION & GPS
  if (
    lower.includes("location") ||
    lower.includes("gps") ||
    lower.includes("kaha hu") ||
    lower.includes("current location") ||
    lower.includes("mera pata")
  ) {
    return {
      handled: true,
      actionType: "location_check",
      spokenResponse: `Aapki current live GPS location hai: ${deviceState.location.city}, ${deviceState.location.address}.`,
    };
  }

  // 10. ANDROID SYSTEM INFO / VERSION
  if (
    lower.includes("android version") ||
    lower.includes("os version") ||
    lower.includes("device info") ||
    lower.includes("phone specs") ||
    lower.includes("system status") ||
    lower.includes("ram kitna hai") ||
    lower.includes("storage kitna hai") ||
    lower.includes("mobile access")
  ) {
    return {
      handled: true,
      actionType: "device_info",
      spokenResponse: `Aapka device Android ${deviceState.androidVersionNumber} (API ${deviceState.apiLevel}) par run kar raha hai with complete hardware & all-apps access.`,
    };
  }

  // 11. BRIGHTNESS & VOLUME
  const brightMatch = lower.match(/(?:set\s+brightness|brightness)\s+(?:to\s+)?(\d+)/i);
  if (brightMatch) {
    const val = Math.min(100, Math.max(10, parseInt(brightMatch[1], 10)));
    return {
      handled: true,
      actionType: "brightness_set",
      spokenResponse: `Display brightness ${val}% set kar di hai.`,
      payload: { value: val },
    };
  }

  const volMatch = lower.match(/(?:set\s+volume|volume)\s+(?:to\s+)?(\d+)/i);
  if (volMatch) {
    const val = Math.min(100, Math.max(0, parseInt(volMatch[1], 10)));
    return {
      handled: true,
      actionType: "volume_set",
      spokenResponse: `Device volume ${val}% set kar diya hai.`,
      payload: { value: val },
    };
  }

  // 12. CONTACTS & CLOCK HUBS
  if (lower.includes("contact") || lower.includes("contacts")) {
    return {
      handled: true,
      actionType: "contacts_open",
      spokenResponse: "Android contacts list open kar rahi hu.",
    };
  }

  if (lower.includes("clock") || lower.includes("alarm list") || lower.includes("stopwatch")) {
    return {
      handled: true,
      actionType: "clock_open",
      spokenResponse: "Android clock and alarm manager open kar rahi hu.",
    };
  }

  // 13. UNIVERSAL ANDROID APP LAUNCHER (Matches any of the 43+ Android Apps or "open <app>" / "<app> kholo" / "<app> chalao")
  const appOpenMatch =
    lower.match(/^(?:open|launch|start|run)\s+(.+)$/i) ||
    lower.match(/^(.+?)\s+(?:kholo|open\s+karo|chalao|chalu\s+karo|dikhao|app\s+kholo)$/i);

  if (appOpenMatch) {
    const rawTarget = appOpenMatch[1].replace(/\b(?:app|application)\b/gi, "").trim();
    const matchedApp = findAndroidAppByName(rawTarget);

    if (matchedApp) {
      if (matchedApp.internalAction) {
        return {
          handled: true,
          actionType: "app_open",
          spokenResponse: `Bilkul! ${matchedApp.name} open kar rahi hu.`,
          payload: { internalAction: matchedApp.internalAction, appName: matchedApp.name, packageName: matchedApp.packageName },
        };
      }
      const launchUrl = resolveAppLaunchUrl(matchedApp);
      return {
        handled: true,
        actionType: "app_open",
        spokenResponse: `Zaroor! ${matchedApp.name} (${matchedApp.packageName}) launch kar diya hai.`,
        payload: { url: launchUrl, appName: matchedApp.name, packageName: matchedApp.packageName },
      };
    }
  }

  // Also check if user directly mentioned an app name with a search query, e.g. "youtube par arijit singh chalao"
  for (const app of ALL_ANDROID_APPS) {
    if (lower.includes(app.id.toLowerCase()) || lower.includes(app.name.toLowerCase())) {
      if (
        lower.includes("open") ||
        lower.includes("kholo") ||
        lower.includes("chalao") ||
        lower.includes("launch") ||
        lower.includes("play") ||
        lower.includes("search")
      ) {
        const searchClean = lower
          .replace(new RegExp(app.name.toLowerCase(), "gi"), "")
          .replace(new RegExp(app.id.toLowerCase(), "gi"), "")
          .replace(/\b(?:open|kholo|karo|chalao|par|pe|on|in|search|play|song|video|app)\b/gi, "")
          .trim();

        if (app.internalAction) {
          return {
            handled: true,
            actionType: "app_open",
            spokenResponse: `Bilkul! ${app.name} open kar rahi hu.`,
            payload: { internalAction: app.internalAction, appName: app.name, packageName: app.packageName },
          };
        }

        const url = resolveAppLaunchUrl(app, searchClean || undefined);
        return {
          handled: true,
          actionType: "app_open",
          spokenResponse: searchClean
            ? `${app.name} par "${searchClean}" open kar rahi hu!`
            : `Bilkul! ${app.name} launch kar diya hai.`,
          payload: { url, appName: app.name, packageName: app.packageName },
        };
      }
    }
  }

  return {
    handled: false,
    actionType: "chat",
    spokenResponse: "",
  };
}
