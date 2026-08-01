using System.Runtime.InteropServices;
using UnityEngine;

/// <summary>
/// JS interop for SENWITT React host. See .agents/skills/senwitt-unity-webgl/SKILL.md
/// </summary>
public static class SenwittWebBridge
{
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void SenwittUnityReady();

    [DllImport("__Internal")]
    private static extern void SenwittUnityComplete(string json);

    [DllImport("__Internal")]
    private static extern void SenwittUnityCancel();
#endif

    public static void Ready()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        SenwittUnityReady();
#else
        Debug.Log("[SENWITT] Ready (editor stub)");
#endif
    }

    public static void Complete(string json)
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        SenwittUnityComplete(json);
#else
        Debug.Log("[SENWITT] Complete: " + json);
#endif
    }

    public static void Cancel()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        SenwittUnityCancel();
#else
        Debug.Log("[SENWITT] Cancel (editor stub)");
#endif
    }
}
