#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
using UnityEngine.InputSystem.UI;
#endif

/// <summary>
/// Batch-friendly setup + WebGL build for the Spatial Memory pilot.
/// Menu: SENWITT → …  or -executeMethod SenwittSpatialBuild.SetupAndBuildWebGL
/// </summary>
public static class SenwittSpatialBuild
{
    const string ScenePath = "Assets/Scenes/SpatialMemory.unity";
    // Assets → project → unity/ → app/public/unity/spatial-memory
    static string WebGlOutDir =>
        Path.GetFullPath(Path.Combine(Application.dataPath, "../../../public/unity/spatial-memory"));

    [MenuItem("SENWITT/Setup Spatial Memory Scene")]
    public static void SetupScene()
    {
        Directory.CreateDirectory(Path.Combine(Application.dataPath, "Scenes"));

        var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);

        // Remove default Main Camera light clutter is fine; keep camera for clarity.
        var root = new GameObject("GameRoot");
        root.AddComponent<SpatialMemoryGameController>();

        // Ensure EventSystem exists for UI clicks in player.
        if (Object.FindFirstObjectByType<EventSystem>() == null)
        {
            var es = new GameObject("EventSystem", typeof(EventSystem));
#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
            es.AddComponent<InputSystemUIInputModule>();
#else
            es.AddComponent<StandaloneInputModule>();
#endif
        }

        // Soft mist clear color
        var cam = Object.FindFirstObjectByType<Camera>();
        if (cam != null)
        {
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.933f, 0.953f, 0.973f); // #eef3f8
        }

        EditorSceneManager.SaveScene(scene, ScenePath);
        var scenes = new EditorBuildSettingsScene[]
        {
            new EditorBuildSettingsScene(ScenePath, true),
        };
        EditorBuildSettings.scenes = scenes;

        // Match React host filename probes (spatial-memory.* OR Build.*)
        PlayerSettings.productName = "spatial-memory";
        PlayerSettings.companyName = "SENWITT";
        PlayerSettings.defaultWebScreenWidth = 960;
        PlayerSettings.defaultWebScreenHeight = 720;
        PlayerSettings.runInBackground = true;

        AssetDatabase.SaveAssets();
        Debug.Log("[SENWITT] Scene saved to " + ScenePath);
    }

    [MenuItem("SENWITT/Build WebGL → public/unity/spatial-memory")]
    public static void BuildWebGL()
    {
        if (!File.Exists(ScenePath))
            SetupScene();

        Directory.CreateDirectory(WebGlOutDir);

        var opts = new BuildPlayerOptions
        {
            scenes = new[] { ScenePath },
            locationPathName = WebGlOutDir,
            target = BuildTarget.WebGL,
            options = BuildOptions.None,
        };

        var report = BuildPipeline.BuildPlayer(opts);
        var summary = report.summary;
        if (summary.result != BuildResult.Succeeded)
        {
            Debug.LogError("[SENWITT] WebGL build failed: " + summary.result);
            if (Application.isBatchMode)
                EditorApplication.Exit(1);
            return;
        }

        Debug.Log("[SENWITT] WebGL build OK → " + WebGlOutDir + " sizeBytes=" + summary.totalSize);
        if (Application.isBatchMode)
            EditorApplication.Exit(0);
    }

    /// <summary>CI / agent entrypoint.</summary>
    public static void SetupAndBuildWebGL()
    {
        SetupScene();
        BuildWebGL();
    }
}
#endif
