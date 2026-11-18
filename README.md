# MOTE Stage — offline desktop build kit

This project contains the current MOTE Stage avatar, desktop window support, and scripts to build, install, and launch Mac and Windows apps.

## Offline operation

The installed app needs **no internet connection, browser, account, server, API key, or Node.js installation**. Three.js, the face-tracking model, its WebAssembly engine, and all interface assets are bundled. External web requests are blocked in the app's web content. Microphone audio and raw camera frames stay on the computer. The projector window communicates locally with the controller. Optional NDI output sends the rendered audience video over the local network when enabled.

**The first build requires internet** to install the pinned Electron and packaging tools. This source ZIP is a build kit, not a collection of prebuilt apps. Once you build an installer, you can copy it to another supported computer and install and run it offline. Build on a Mac for Mac; build on Windows for Windows.

## Mac: build, install, run

1. Install Node.js 22.12 or newer from https://nodejs.org. Use an LTS release.
2. Extract the entire ZIP into a normal writable folder.
3. Double-click **build_install_run.command**. Alternatively, in Terminal enter that folder and run:

   ```sh
   bash build_install_run.sh
   ```

The script builds for the Mac you are using (Apple silicon or Intel), produces DMG and ZIP files in `release/`, installs to `~/Applications/MOTE Stage.app`, and opens it. An existing installation is backed up before replacement. Close the app before rebuilding. Saved settings live separately and survive replacement.

You can copy the DMG to another Mac with the **same processor architecture** and install without internet. To build the other architecture, run `npx electron-builder --mac dmg zip --x64 --publish never` or use `--arm64` after installing dependencies. These are separate architecture builds, not a universal binary.

The development build has no Apple Developer ID signature or notarization. macOS may ask you to approve it in Privacy & Security. Managed Macs may require administrator approval. For wider distribution, arrange Developer ID signing and notarization; the default `mac.identity: null` is intended for this local build kit.

## Windows: build, install, run

1. Install Node.js 22.12 or newer from https://nodejs.org. Use an LTS release.
2. Extract the entire ZIP into a normal writable folder.
3. Double-click **build_install_run.cmd**, or run **build_install_run.ps1** from PowerShell.

The script creates an x64 installer in `release/`, installs for your current user under `%LOCALAPPDATA%\Programs\MOTE Stage`, and launches the app. No administrator installation is requested. Close an existing MOTE Stage instance before rebuilding. The CMD launcher allows its bundled PowerShell script to run for that process only; it does not change your machine's execution policy. Follow your organization's script policy on managed computers.

Copy `MOTE-Stage-Setup-1.20.0-x64.exe` from `release/` to another supported Windows x64 computer to install and run offline. The installer is unsigned, so Windows may show an unrecognized-publisher notice. Signing is a separate distribution step.

## Appearance treatments

The default Luminous look follows a soft pastel glowing-orb direction: a uniform sphere, blurred halo, dark center, with Nord’s abstract, gender-neutral features: rounded pupil-free white eyes and a simple luminous mouth. Edge glow blends softly into black and can be adjusted in Appearance. There is no nose. White light blooms gently from the features. Each eye fades out as it closes; mouth light fades out when the mouth closes. Emerging face controls the feature strength. Voice input adds light energy. The Appearance tab also offers Ethereal (clear cool glass), Mercury (liquid metal), and Companion (warm glass with softer eyes). Selecting a material preserves your chosen colors, optics, motion and rendering quality. Reset section restores just the active group; Undo restores the previous appearance. These are procedural real-time materials with a bundled local studio reflection map and simple procedural eye shading. No image or network downloads are required at runtime.

## Control desk and avatar output

The controller opens maximized as a normal resizable window on Actor, with a separate Settings tab for input, appearance, and cue setup. The avatar opens automatically in a separate native window. Two large 16:9 local monitors below the Actor buttons show the camera and a lightweight live Nord view, even when the separate stage window is elsewhere. The projector keeps its own full-quality renderer. Blackout collapses one picture plane into a centered phosphor beam. Resting expressions keep the mouth closed until voice or webcam jaw input opens it.

On Windows x64 with [NDI Tools](https://ndi.video/tools/) installed, click **Start NDI** beside **Open avatar window**. Select **MOTE Stage** under your computer's name in NDI Studio Monitor or another NDI receiver. The source carries the audience window's video at up to 30 fps and fits within 1920 × 1080 while keeping the window's aspect ratio. Click **Stop NDI** or close the audience window to end the feed. NDI starts off each time you launch the app.

## Using MOTE Stage

- Enable microphone input to animate the mouth and optics. Choose your audio device, sensitivity, and noise gate.
- Choose expressions manually or enable acoustic expression presets. Those presets are artistic mappings of vocal energy, not reliable emotion recognition or an AI conversation system.
- Enable webcam head tracking. Use **Center head pose** while looking straight ahead.
- Optionally enable **Override face & expression from webcam**. It drives jaw, smiles, frowns, brows, and blinks while a face is visible; loss of tracking returns control to the microphone/operator.
- **Open stage view** creates a second native window showing only the avatar on black. Drag it to the projector. Settings, cues, artwork, mic motion, webcam tracking, gestures, and blackout synchronize locally.
- Press **F** or double-click the stage output for fullscreen. **F11** toggles native fullscreen; **Escape** leaves it.
- **B** toggles the TV squeeze blackout. **X** freezes motion. Keys **1–8** select expressions; **Space** advances cues while focus is outside a control.
- Export a show JSON to back up cues and appearance. Uploaded character artwork is stored separately in local app storage, so keep your original images too.
- Quit the controller to close the entire app, release the camera/microphone, and stop the display-sleep prevention used during a show.

## Other build commands

```sh
npm ci
npm run check
npm start
npm run build:mac
npm run build:win
```

`npm start` opens the development app. Installers are self-contained; the installed apps do not run npm or contact Sites. Desktop settings and artwork are separate from the hosted website's browser storage. Export/import your show and re-upload artwork to transfer it.

## Permissions and troubleshooting

Allow microphone and camera access when your operating system prompts. On Mac, access can be changed in System Settings → Privacy & Security → Microphone / Camera. Restart the app after changing permissions. Avoid camera capture in other apps during rehearsal if your camera only supports one application.

On the first webcam start, the bundled model needs a few seconds to initialize; there is no online download. If head tracking is reversed or offset, face forward and use **Center head pose**. If no face is visible, improve lighting and position your face in the preview.

The package includes both SIMD and non-SIMD face-tracking WebAssembly files. Actual rendering and tracking speed depends on the computer's GPU, webcam, and drivers. Rehearse with the projector resolution and hardware you plan to use.

## Validation and dependencies

Source checks verify JavaScript syntax, local asset routing, control bindings, required offline assets, and direct controller-to-stage messaging with BroadcastChannel unavailable. Native packaging is checked on the build machine. Camera capture, GPU appearance, and projector operation require testing on your own hardware; the Windows installer needs verification on Windows.

Build references: [Electron custom protocols](https://www.electronjs.org/docs/latest/api/protocol), [electron-builder Mac targets](https://www.electron.build/docs/mac/), [Windows NSIS packaging](https://www.electron.build/nsis/).

Third-party components: Electron, electron-builder, Three.js, and MediaPipe Tasks Vision / Face Landmarker. See `THIRD_PARTY_NOTICES.md` and the bundled vendor notices. The lockfile pins build-tool dependencies.

The face is entirely mesh geometry: rounded three-dimensional glass eyes and a deforming mouth edge, and a recessed mouth cavity. There are no facial image assets or sprite planes. The studio panorama is generated locally for lighting only.

## Screen-space camera optics

Nord renders the complete 3D scene to a full-resolution, multisampled,
16-bit floating-point buffer. The camera post-process extracts HDR highlights
with a soft threshold, filters and blurs them at five scales, and combines
near and wide bloom. Lens flare derives subtle chromatic ghosts and horizontal
streaks from the same visible highlight image. There are no flare image assets.
The final composite adds light in linear space and applies tone mapping and
display color conversion once. Bloom and Lens flare have separate controls in
Appearance; their settings synchronize to the audience window and exported shows.

Webcam blinks are remapped to reach zero openness at a blendshape coefficient
of 0.5, rather than requiring 1.0. Each closed eye is hidden with zero emission,
including during an independent wink. All optical targets are cleared every
frame so a closed feature leaves no retained glow.

## Tracking and stage failsafe

Webcam expressions use an adjustable **Expression strength** control, with
stronger smile/frown curves, individual eye shapes, brow-driven lift/tilt,
and asymmetric movement. A closed mouth stays invisible. Closed eyes are
hidden individually, independent of expression strength.

**Power down when tracking is lost** is enabled by default. It arms after
the first face is tracked. A loss lasting 1.2 seconds triggers the centered
TV shutdown. Stable tracking for 0.35 seconds triggers the reverse power-on.
Short gaps are ignored. Turning the webcam off intentionally or disabling
the failsafe disarms it. Manual blackout remains in force after tracking
returns. The failsafe is local and its state synchronizes to the output.

The eyes and filled mouth are curved beneath the spherical glass, with
vertex containment checks across deformations. The legacy mouth outline
was removed. Stronger refraction and dispersion affect the facial shapes
and a new animated, shader-driven 3D star field behind them. **Star field**
in Appearance adjusts its brightness; zero returns to a black background.
The stars drift slowly, have subtle depth/twinkle, and transmit through
the clear glass before the outer shell bends their image.

## Voice-driven fluid and deformation

**Voice drives fluid & shape** in Appearance enables amplitude modulation of
the surface waves, flow speed and subtle expansion. It uses a fast attack and
a gentle release. The noise phase is integrated continuously, so changes in
loudness do not jump the animation. Disable it to retain the chosen idle flow
and geometry without voice modulation. The setting is independent of facial
expression selection and is synchronized, saved, and included in show export.

## Appearance workspace and saved looks

Appearance is organized into Surface, Motion, Color & light, Stars, and Saved
looks. Each group fits the control window without covering the audience output.
Surface groups shape and face, glass optics, and depth and edges. Feature softness
controls the mesh contour; edge softness spreads the silhouette light without
reducing image resolution. Motion adds speed, scale,
curl, direction and voice response. Color & light offers three custom hex/color
values, hue, saturation, brightness, feature emission and optical post effects.
The character palette feeds the glass and halo. Stars use their own palette by default; Star color offers an optional Follow avatar colors switch.

Stars offers count (0–6,000), randomized minimum/maximum size, movement speed
and direction, depth spread, twinkle, brightness and emitted light. Bright
particles pass through the same HDR bloom and lens-flare pipeline as Nord.

In Saved looks, enter a name and choose Save current look. Reusing a name updates
that saved appearance. Load restores its appearance without altering the actor's
camera, face tracking, blackout or microphone state. Delete removes the saved
look and offers Undo delete. Looks persist across app launches. Export current
look and Import look transfer a named appearance as a small offline JSON file.

The controller and avatar titles show the actual app version. Open avatar window
focuses the existing native output. Window → Show controls (Cmd/Ctrl+1) and Show
avatar (Cmd/Ctrl+2) switch reliably between the two windows.

The revised glass shader refracts rays onto the curved interior surface using
separate red, green and blue indices of refraction. The extra outer rim was
removed. The TV effect splits the actual HDR image into RGB fringes before
collapsing it to a colored line and dot. The voice halo is a separate, occluded
volume behind the character, driven by vocal amplitude.

After a face is tracked, **Test failsafe** runs a short simulated tracking gap
through the same live power-down and recovery path. Use it during rehearsal
to check the controller/output connection and TV effect without leaving view.

## Appearance refinements in 1.12

The workspace groups related controls and keeps the audience output separate.
Material selection changes only the material, preserving all tuning and custom
colors. Ethereal, Mercury, Companion and Luminous have distinct optical models.
Glass reflection has a true zero, and depth changes transmission in every glass
material. The overwritten optical calculations were removed. Star movement has
an expanded visible range, while zero still stops drift.

Edge softness, feature softness and halo spread are independent of emission and
screen-space bloom. The vocal halo has a smooth attack and release; it remains
available when voice deformation is switched off. Size stays editable while
motion is frozen. The Motion and Stars panels explain when freeze, zero count,
or zero brightness is preventing a visible result.

Reset section restores only the selected workspace. Undo restores the previous
appearance, including a material change, palette change, preset load or reset.
Appearance undo does not change live camera, microphone, cues or blackout state.
Preset save/load/import includes the new controls.

## Glass correction in 1.13

Refraction now transports rays through a rounded optical meniscus instead of
sampling the almost-touching inner sphere. The eye and mouth meshes sit slightly
farther beneath the shell, and their captured image bends through the same lens
as the background. Liquid depth increases optical travel; refraction zero keeps
the original view. The edge response uses view incidence so it follows a turned
head. The sampled ray remains inside the outer volume and has no sphere-miss
fallback that can snap the image at the rim.

Nonmetallic glass reflections fade out over the clear central face and increase
toward the rim. The studio strip can no longer leave a nose-like mark there.
The lens-flare shader retains chromatic streaks and source-aligned scatter;
mirrored image ghosts that resembled enlarged copies of the eyes were removed.
All existing appearance controls and saved looks remain supported.

## Actor desk in 1.14

The first tab is **Actor**. Eight large expression buttons and four gestures are
available without microphone, webcam, palette, or model setup controls. The menus
and controls use filled surfaces and text selection, with no decorative outlines.
Freeze and Blackout remain quiet direct controls. Cue advance is grouped with
the cue sequence in Settings.

Tap an expression, use keys 1–8, or choose Nod, Look left/right, or Close eyes.
Each action eases in, holds briefly and releases back to the current face tracking
or resting expression. The action never replaces the saved resting expression,
camera coefficients or cue. Repeated actions restart from the new selection.
Release action or Esc returns early with a short fade. Close eyes fully removes
both eyes and their emission while held. Explicit expressions can briefly reveal
the mouth so a Smile or Frown reads even when the resting mouth is closed.

**Settings → Inputs & actions** contains microphone and webcam setup, resting
expression and action behavior. Choose **Blend with tracking** or **Override
tracking** and a duration from 3 to 5 seconds (default 4). Speech articulation and
natural blinks remain live beneath expression actions. Head gestures blend toward
the requested direction; their strength follows the chosen mode. Actions also
work over a frozen base pose, then return to that held pose.

**Settings → Appearance** retains all material, color, optics, stars and saved
looks. **Settings → Show cues** contains cue setup and show import/export. Inputs
and action preferences persist independently of appearance presets.

The audience display receives timed actions locally, resumes only the remaining
time if reopened, and never repeats an expired action. Temporary actions are not
saved or replayed when the app restarts. Camera tests remain optional.

## Surface and color motion in 1.15

Settings → Appearance → Surface adds **Reflection roughness**, **Glass frosting**,
**Surface tension**, and **Iridescence**. Roughness softens studio reflections;
frosting scatters the image transmitted through the glass only. The output stays
at its chosen full resolution. Tension smooths small waves into broader currents.
Iridescent light follows the curved rim while the central reflection mask remains
clear. Motion adds breathing amount and rate, independent of the flow clock.

The new **Color motion** panel contains palette drift, hue sweep and rate, emitted
light pulses and rate, ribbon drift/width/light, voice color shift and voice light.
Negative drift reverses movement. Speed changes integrate smoothly without
resetting the animation. Glass and halo share the animated palette; stars can optionally follow it. Eyes
and mouth retain their white emission and closure behavior. Ribbons now contribute
to every material, with the strongest volume in Luminous.

Silk, Prism tide and Voice bloom are one-click starting points that preserve your
chosen palette. Animate colors switches the dynamic color layer on/off; off settles
back to the base colors and holds ribbon position. Freeze pauses all animation
clocks. Voice controls use local audio amplitude and remain independent of the
Voice drives fluid & shape option. Use Test voice without enabling a microphone.

All new parameters, the master switch and custom colors are included in saved
looks, reset/undo and appearance import/export. Actor controls remain minimal.

## Actor tracking, monitors and character reactions in 1.16

**Settings → Tracking & actors** contains webcam setup, free head movement, head centering, facial calibration and named profiles. Head rotation always follows the camera while tracking is enabled. **Free head movement across stage** additionally maps left/right, up/down and distance to Nord's position; Movement range changes that translation without exaggerating nods. Center head pose temporarily recenters the actor without overwriting a saved facial profile.

Capture a relaxed face with open eyes and a closed mouth for 1.5 seconds. Optionally learn an expressive range for 3.5 seconds by smiling, opening the mouth and blinking. The app rejects capture without a fresh tracked face and cancels if the actor leaves frame. Save a named profile; Load, Delete and Undo delete manage actors locally. The active calibration survives relaunch. Profiles contain numerical coefficients and head offsets only, never camera images. Recenter again after changing camera placement.

Eight timed expression actions now reshape the actual 3D glass: Angry forms spikes around the sphere; Smile adds broad playful lobes; Frown pulls fluid downward; Afraid shivers; Curious ripples asymmetrically; Thinking swirls; Listening pulses gently; Neutral calms the surface. **Settings → Inputs & actions → Surface reactions** scales these effects from zero to 150%. They follow the same smooth 3–5 second action envelope and return to the live tracked character. The speech mouth opens sideways with restrained vertical travel and a lower-jaw bias; rest remains fully closed.

**Appearance → Stars** adds field spread, softness and twinkle speed to density, size, brightness, depth and drift controls. **Star color** has a separate palette, three editable colors, hue, saturation and animated color drift; Follow avatar colors is optional and preserves the independent palette. Background fill defaults to black and can be tinted. These controls save, load, export, reset and undo with appearances. Existing star colors are copied once during migration so separating the palettes does not discard the prior look.

The local Nord monitor renders at one device pixel per CSS pixel and about 30 fps while the Actor tab is visible. The camera monitor reuses the tracking stream; it does not open a second camera. The audience window remains a separate clean output.

Device startup has a fifteen-second access timeout and a Cancel connection action. Delayed streams are stopped after cancellation. If a device request times out, check system privacy permissions and device availability, then retry; the interface remains usable.

## Whole-body action performances in 1.17

Thinking now morphs the actual glass body from a rounded square into a rounded triangle, then back to Nord's default sphere within the chosen action duration. Eyes and mouth fade out together and become a centered line of real 3D white dots cycling one, two, three. The visible dots remain centered as their count changes. Tracking and the original facial features ease back in at release; the thought face also works over a frozen base pose.

Smile becomes a rounded five-point star with restrained vertical motion. Frown settles into a soft wide cushion, Curious shifts into a turning asymmetric form, and Listening preserves the round core with gentle side ripples. Neutral settles the original sphere. The established Angry spikes and Afraid shiver remain unchanged. Surface reactions scales body deformation; zero leaves the face action active. Dots are emissive mesh volumes beneath the optical glass and use the existing bloom, refraction and feature visibility controls.

Tracked position and expression bob are composed independently so the body cannot accumulate vertical drift on high-refresh displays. Smile uses a restrained small bob instead of its former larger offset.

## Character finish and performance continuity in 1.18

Changing an action now crossfades the visible body into the next performance instead of removing its shape immediately. Thinking dots ease in and out as small 3D volumes, stay centered during count changes and release completely when the normal face returns. Blink and speech tracking continue through their existing independent paths.

Glass and inner-surface normals now come from central differences of the complete displaced surface, including body silhouettes, fluid waves, voice and breathing. This keeps specular light and refraction aligned with the real curvature at rounded star points and morphing corners. The approved action shapes and reduced vertical bob are retained. The full 0–150% Surface reactions range now applies to body silhouettes as well as the original spikes and shiver.

## Facial performance and gesture timing in 1.19

Smile now gently arches the filled white eye volumes, including smiles from face tracking. These are curved 3D meshes with rounded ends: no pupils, lashes, extra outlines or facial images. The arc contracts with each blink and fully disappears when closed. Other expression contours retain their established shapes.

Look left and Look right let the eyes lead the head by a small amount, then return to center as the head takes over. Nod performs one deliberate downstroke with restrained anticipation and settling instead of repeating continuously. The nod layers over the tracked head angle instead of pulling the actor back to a neutral pitch. All gestures retain the selected three-to-five-second duration and automatic release.

## Continuous performance in 1.20

Switching actions keeps procedural surface motion moving forward. The controller and audience output share a transient show clock, including when the output is reopened or the Actor preview has been hidden. Thinking hands its white face volumes over to the loading dots through a short blink, preventing overlapping faces. Repeating Thinking keeps the normal eyes hidden until the action releases.
