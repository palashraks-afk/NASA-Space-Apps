# Adding 3D models

The app's stations and the body figure are built from simple shapes so they work without any files. Real models replace them without code changes.

## Steps

1. Export the model as **glTF binary (`.glb`)** or `.gltf`. Blender: File > Export > glTF 2.0, format "glTF Binary". Keep it under about 5 MB; apply scale and rotation before export.
2. Put the file in `lab/public/models/`.
3. Add an entry to `lab/public/models/models.json`:

```json
{
  "models": [
    { "file": "medical_rack.glb", "replace": "medical", "scale": 1, "position": [0, 0, 0], "rotationY": 0 },
    { "file": "astronaut.glb", "replace": "body" },
    { "file": "treadmill.glb", "position": [0.4, -0.55, 1.2], "rotationY": 1.57 }
  ]
}
```

4. Run `npm run dev` in `lab/` and open the station. If the file fails to load, the console says so and the built-in shapes stay.

## What each field does

| Field | Meaning |
|---|---|
| `file` | File name inside `lab/public/models/` |
| `replace` | Optional. `medical`, `air`, `galley`, `radiation`, `body`, `clock`, `evidence` or `board`. Hides that station's built-in props and puts the model in its place. Parts that show live data stay: the medical and galley screens, the air readout, fan and airflow, the radiation globe and screen. |
| `position` | Metres. With `replace`, relative to the station (x right, y up, z out of the wall). Without it, in module coordinates (z along the module, y up). |
| `rotationY` | Radians around the vertical axis |
| `scale` | Uniform scale |

## The body figure

Name the meshes (or their parent nodes) so they include one of these words, in any case: `brain`, `eyes`, `heart`, `lungs`, `gut`, `bones`, `muscles`, `immune`. Those meshes become clickable and take the status colours (green, amber, coral). For example `Heart`, `heart_mesh`, `Bones_Spine` all work. A model with no named parts is shown as a see-through shell with the built-in organs inside it, still clickable.

## Sizes for reference

The module interior is about 2.3 m wide, 2.2 m high and 10 m long. Station racks are about 1 m wide and 1.25 m high. The body figure is about 1.2 m tall standing on its pad.

## Licences

Only use models you made or that allow redistribution (CC0, CC BY with credit). Add each one to `lab/public/CREDITS.md`.
