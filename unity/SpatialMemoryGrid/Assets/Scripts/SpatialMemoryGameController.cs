using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
using UnityEngine.InputSystem.UI;
#endif

/// <summary>
/// SENWITT Spatial Memory Grid — parity with React SpatialMemoryGame.tsx
/// Attach to GameObject named GameRoot (SendMessage target from React).
/// Unity 6.5+ / WebGL pilot. Optional HUD uses uGUI Text (no TMP required).
/// </summary>
public class SpatialMemoryGameController : MonoBehaviour
{
    const int MaxRounds = 4;

    [Header("Grid")]
    [SerializeField] Transform gridParent;
    [SerializeField] GameObject tilePrefab; // optional; created at runtime if null
    [SerializeField] int gridSize = 3;

    [Header("Bright Focus colors")]
    [SerializeField] Color idleColor = new Color(0.886f, 0.922f, 0.957f); // mist
    [SerializeField] Color activeColor = new Color(0.078f, 0.722f, 0.651f); // teal-bright
    [SerializeField] Color pickedColor = new Color(1f, 0.969f, 0.929f); // warm
    [SerializeField] Color failColor = new Color(1f, 0.894f, 0.902f);
    [SerializeField] Color successColor = new Color(0.82f, 0.98f, 0.898f);

    [Header("Optional UI (uGUI Text — leave null OK)")]
    [SerializeField] Text statusLabel;
    [SerializeField] Text roundLabel;
    [SerializeField] Text scoreLabel;

    readonly List<TileButton> _tiles = new List<TileButton>();
    readonly List<int> _sequence = new List<int>();
    readonly List<int> _userSequence = new List<int>();

    int _round = 1;
    int _score;
    bool _playingSequence;
    bool _acceptInput;
    bool _finished;
    float _startTime;

    enum Status { Watch, Repeat, Success, Fail }
    Status _status = Status.Watch;

    void Awake()
    {
        EnsureUiRoot();
    }

    void Start()
    {
        EnsureGrid();
        SenwittWebBridge.Ready();
        // Auto-start in editor; React will call StartGame on WebGL after Configure.
#if UNITY_EDITOR
        StartGame();
#endif
    }

    void EnsureUiRoot()
    {
        if (gridParent != null) return;

        var canvasGo = GameObject.Find("SenwittCanvas");
        if (canvasGo == null)
        {
            canvasGo = new GameObject("SenwittCanvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            var canvas = canvasGo.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = canvasGo.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(960, 720);
            if (FindFirstObjectByType<EventSystem>() == null)
            {
                var es = new GameObject("EventSystem", typeof(EventSystem));
#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
                es.AddComponent<InputSystemUIInputModule>();
#else
                es.AddComponent<StandaloneInputModule>();
#endif
            }
        }

        var gridGo = new GameObject("Grid", typeof(RectTransform), typeof(GridLayoutGroup));
        gridGo.transform.SetParent(canvasGo.transform, false);
        var rt = gridGo.GetComponent<RectTransform>();
        rt.anchorMin = new Vector2(0.5f, 0.5f);
        rt.anchorMax = new Vector2(0.5f, 0.5f);
        rt.pivot = new Vector2(0.5f, 0.5f);
        rt.sizeDelta = new Vector2(360, 360);
        gridParent = gridGo.transform;
    }

    /// <summary>Called from JS: SendMessage('GameRoot','Configure', '{"gridSize":3}')</summary>
    public void Configure(string json)
    {
        if (string.IsNullOrEmpty(json)) return;
        // Minimal parse — avoid JsonUtility dependency on nested types for one field
        if (json.Contains("\"gridSize\":4") || json.Contains("\"gridSize\": 4"))
            gridSize = 4;
        else
            gridSize = 3;
        RebuildGrid();
    }

    /// <summary>Called from JS: SendMessage('GameRoot','StartGame','')</summary>
    public void StartGame()
    {
        _finished = false;
        _round = 1;
        _score = 0;
        _startTime = Time.realtimeSinceStartup;
        EnsureGrid();
        StartCoroutine(RunRound(_round));
    }

    void EnsureGrid()
    {
        if (_tiles.Count == gridSize * gridSize) return;
        RebuildGrid();
    }

    void RebuildGrid()
    {
        foreach (Transform child in gridParent != null ? gridParent : transform)
        {
            if (Application.isPlaying) Destroy(child.gameObject);
            else DestroyImmediate(child.gameObject);
        }
        _tiles.Clear();

        var parent = gridParent != null ? gridParent : transform;
        var layout = parent.GetComponent<GridLayoutGroup>();
        if (layout == null) layout = parent.gameObject.AddComponent<GridLayoutGroup>();
        layout.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
        layout.constraintCount = gridSize;
        layout.cellSize = new Vector2(96, 96);
        layout.spacing = new Vector2(12, 12);
        layout.childAlignment = TextAnchor.MiddleCenter;

        int count = gridSize * gridSize;
        for (int i = 0; i < count; i++)
        {
            GameObject go;
            if (tilePrefab != null)
            {
                go = Instantiate(tilePrefab, parent);
            }
            else
            {
                go = new GameObject("Tile_" + i, typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button), typeof(TileButton));
                go.transform.SetParent(parent, false);
                var img = go.GetComponent<Image>();
                img.color = idleColor;
            }

            var tile = go.GetComponent<TileButton>();
            if (tile == null) tile = go.AddComponent<TileButton>();
            tile.Init(i, this, idleColor, activeColor, pickedColor);
            _tiles.Add(tile);
        }
    }

    IEnumerator RunRound(int round)
    {
        _status = Status.Watch;
        _playingSequence = true;
        _acceptInput = false;
        _userSequence.Clear();
        SetAllInteractable(false);
        PaintAll(idleColor);
        UpdateHud();

        int seqLen = round + 2;
        _sequence.Clear();
        for (int i = 0; i < seqLen; i++)
        {
            int next = Random.Range(0, gridSize * gridSize);
            while (i > 0 && next == _sequence[i - 1])
                next = Random.Range(0, gridSize * gridSize);
            _sequence.Add(next);
        }

        yield return new WaitForSeconds(0.35f);

        for (int s = 0; s < _sequence.Count; s++)
        {
            int idx = _sequence[s];
            _tiles[idx].SetActiveFlash();
            yield return new WaitForSeconds(0.45f);
            _tiles[idx].SetIdle();
            yield return new WaitForSeconds(0.35f);
        }

        _playingSequence = false;
        _acceptInput = true;
        _status = Status.Repeat;
        SetAllInteractable(true);
        UpdateHud();
    }

    public void OnTilePressed(int index)
    {
        if (_finished || _playingSequence || !_acceptInput || _status != Status.Repeat) return;

        _userSequence.Add(index);
        _tiles[index].SetPicked();
        UpdateHud();

        int step = _userSequence.Count - 1;
        if (_userSequence[step] != _sequence[step])
        {
            _status = Status.Fail;
            _acceptInput = false;
            SetAllInteractable(false);
            PaintAll(failColor);
            UpdateHud();
            StartCoroutine(FinishAfter(1.6f, _score, _round - 1));
            return;
        }

        if (_userSequence.Count == _sequence.Count)
        {
            int points = _round * 30;
            _score += points;
            _acceptInput = false;
            SetAllInteractable(false);
            PaintAll(successColor);

            if (_round >= MaxRounds)
            {
                _status = Status.Success;
                UpdateHud();
                StartCoroutine(FinishAfter(1.6f, _score + 50, MaxRounds));
            }
            else
            {
                _status = Status.Success;
                UpdateHud();
                StartCoroutine(NextRoundAfter(1.2f));
            }
        }
    }

    IEnumerator NextRoundAfter(float delay)
    {
        yield return new WaitForSeconds(delay);
        _round += 1;
        yield return RunRound(_round);
    }

    IEnumerator FinishAfter(float delay, int scoreEarned, int correctCount)
    {
        yield return new WaitForSeconds(delay);
        Finish(scoreEarned, correctCount);
    }

    void Finish(int scoreEarned, int correctCount)
    {
        if (_finished) return;
        _finished = true;
        float elapsedMs = (Time.realtimeSinceStartup - _startTime) * 1000f;
        var sb = new StringBuilder(128);
        sb.Append("{\"scoreEarned\":").Append(scoreEarned)
          .Append(",\"correctCount\":").Append(correctCount)
          .Append(",\"totalItems\":").Append(MaxRounds)
          .Append(",\"totalTimeMs\":").Append(Mathf.RoundToInt(elapsedMs))
          .Append('}');
        SenwittWebBridge.Complete(sb.ToString());
    }

    void SetAllInteractable(bool on)
    {
        foreach (var t in _tiles) t.SetInteractable(on);
    }

    void PaintAll(Color c)
    {
        foreach (var t in _tiles)
        {
            var img = t.GetComponent<Image>();
            if (img != null) img.color = c;
        }
    }

    void UpdateHud()
    {
        if (roundLabel != null) roundLabel.text = $"Round {_round}/{MaxRounds}";
        if (scoreLabel != null) scoreLabel.text = $"{_score} pts";
        if (statusLabel != null)
        {
            switch (_status)
            {
                case Status.Watch: statusLabel.text = "Watch the pattern light up"; break;
                case Status.Repeat: statusLabel.text = $"Tap tiles in order ({_userSequence.Count}/{_sequence.Count})"; break;
                case Status.Success: statusLabel.text = _round >= MaxRounds ? "All rounds complete!" : $"Round {_round} cleared!"; break;
                case Status.Fail: statusLabel.text = "Sequence broken"; break;
            }
        }
    }
}
