# SENWITT — Spatial Memory Grid (Unity 6.5 WebGL pilot)

React embeds the build from `../../public/unity/spatial-memory/` when  
`VITE_UNITY_SPATIAL=true`. HTML fallback stays if the build is missing.

## Prerequisites (Unity 6.5)

In **Unity Hub → Installs**, confirm for your **6.5** editor:

- [x] **WebGL Build Support** (required)
- [ ] Windows/Mac modules optional

Product version string looks like `6000.5.x` (Unity 6.5).

## Active project (already created)

Use the Hub/editor project at:

```text
app/unity/SenwittSpatialMemory
```

(Unity **6000.5.6f1**, uGUI added, scene + batch WebGL builder under `Assets/Editor/SenwittSpatialBuild.cs`.)

Open that folder in Unity Hub → **Add** → open with 6.5. Menu: **SENWITT → Build WebGL → public/unity/spatial-memory**.

Script sources are also mirrored under `unity/SpatialMemoryGrid/Assets/` for the repo scaffold.

### Minimal scene

1. Hierarchy → Create Empty → rename **`GameRoot`**
2. Add Component → `SpatialMemoryGameController`
3. Press **Play** in the Editor — grid should appear and run (editor auto-starts)
4. File → Save As → `Assets/Scenes/SpatialMemory.unity`

### WebGL build

1. File → **Build Profiles** / Build Settings → **WebGL** → Install/Switch if needed  
2. Add Open Scenes → `SpatialMemory`
3. Player Settings (WebGL):
   - Default Canvas Width/Height: **960 × 720**
   - Run In Background: **On**
   - Compression: **Brotli** (or Gzip) for smaller downloads
4. **Build** (not Build And Run) → output folder must be:

   ```text
   <repo>/app/public/unity/spatial-memory
   ```

5. Confirm you have something like:

   ```text
   public/unity/spatial-memory/Build/*.loader.js
   public/unity/spatial-memory/Build/*.framework.js
   public/unity/spatial-memory/Build/*.data
   public/unity/spatial-memory/Build/*.wasm
   ```

   Product name in Player Settings should match those filenames  
   (e.g. product name `spatial-memory` → `spatial-memory.loader.js`),  
   **or** leave Unity defaults (`Build.*`) — the React host accepts both.

## React

```bash
cd "<repo>/app"
# .env
VITE_UNITY_SPATIAL=true
npm run dev
```

Arcade → **Spatial Memory Grid**. Exit stays in React chrome.

## If Play Mode has no clicks

Edit → Project Settings → Player → **Active Input Handling** → **Both**  
(then restart the editor).

## Agent skills

`.agents/skills/senwitt-unity-webgl/SKILL.md` plus `unity-cli`,  
`unity-csharp-scripting`, `unity-build-pipeline`, `new-unity-project`.
