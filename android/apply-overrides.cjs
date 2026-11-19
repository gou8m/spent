// Run after Bubblewrap has generated the Android project, before building it:
//   node android/apply-overrides.cjs <generated project dir>
// It swaps in the launcher icon / splash artwork from android/res-overrides (see make-assets.py) and
// gives the launching activity a theme whose Android 12+ system splash is the brand green with a
// small white "S.", so the first frames, the Chrome-hosted splash and the app all line up.
const fs = require("fs");
const path = require("path");

const project = process.argv[2];
if (!project) throw new Error("usage: node apply-overrides.cjs <generated project dir>");
const res = path.join(project, "app/src/main/res");
const overrides = path.join(__dirname, "res-overrides");

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

copyDir(overrides, res);

const write = (rel, text) => {
  const file = path.join(res, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

write("values/spent_colors.xml", `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#1B6B33</color>
</resources>
`);

// Proper adaptive icon: green background, the "S." in the safe zone, and a single-colour version for themed icons.
write("mipmap-anydpi-v26/ic_launcher.xml", `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
    <monochrome android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`);

write("values/spent_styles.xml", `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.SpentLauncher" parent="@android:style/Theme.Translucent.NoTitleBar" />
</resources>
`);
write("values-v31/spent_styles.xml", `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.SpentLauncher" parent="@android:style/Theme.Translucent.NoTitleBar">
        <item name="android:windowSplashScreenBackground">@color/ic_launcher_background</item>
        <item name="android:windowSplashScreenAnimatedIcon">@drawable/ic_launcher_foreground</item>
    </style>
</resources>
`);

const manifestPath = path.join(project, "app/src/main/AndroidManifest.xml");
let manifest = fs.readFileSync(manifestPath, "utf8");
if (!manifest.includes("@style/Theme.SpentLauncher")) {
  manifest = manifest.replace('android:theme="@android:style/Theme.Translucent.NoTitleBar"', 'android:theme="@style/Theme.SpentLauncher"');
  fs.writeFileSync(manifestPath, manifest);
}
console.log("overrides applied to", project);
