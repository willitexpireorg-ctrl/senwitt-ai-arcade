using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;

/// <summary>One Corsi-grid cell. Wired by SpatialMemoryGameController.</summary>
[RequireComponent(typeof(Button))]
public class TileButton : MonoBehaviour, IPointerClickHandler
{
    public int Index { get; private set; }

    Image _image;
    Button _button;
    SpatialMemoryGameController _game;
    Color _idle;
    Color _active;
    Color _picked;

    public void Init(int index, SpatialMemoryGameController game, Color idle, Color active, Color picked)
    {
        Index = index;
        _game = game;
        _idle = idle;
        _active = active;
        _picked = picked;
        _image = GetComponent<Image>();
        _button = GetComponent<Button>();
        SetIdle();
    }

    public void SetInteractable(bool on)
    {
        if (_button != null) _button.interactable = on;
    }

    public void SetIdle()
    {
        if (_image != null) _image.color = _idle;
    }

    public void SetActiveFlash()
    {
        if (_image != null) _image.color = _active;
    }

    public void SetPicked()
    {
        if (_image != null) _image.color = _picked;
    }

    public void OnPointerClick(PointerEventData eventData)
    {
        if (_game != null) _game.OnTilePressed(Index);
    }
}
