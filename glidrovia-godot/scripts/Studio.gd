extends Node3D

# ── Glidrovia Studio — Editor 3D de Mundos ───────────────────────────────────

enum Tool { SELECT, PLACE, MOVE, DELETE }
var _current_tool: Tool = Tool.PLACE
var _selected_object_type: String = "box"
var _selected_color: Color = Color("#2563eb")
var _placed_objects: Array = []
var _selected_node: Node3D = null

var _camera: Camera3D
var _camera_pivot: Node3D
var _hud: CanvasLayer
var _status_label: Label

# Cámara orbit
var _cam_yaw: float   = 0.3
var _cam_pitch: float = -0.5
var _cam_dist: float  = 18.0
var _orbit_drag: bool = false
var _last_mouse: Vector2

const OBJECT_TYPES = {
	"box":      {"label": "📦 Caja",       "color": Color("#2563eb")},
	"sphere":   {"label": "⚽ Esfera",     "color": Color("#dc2626")},
	"cylinder": {"label": "🥫 Cilindro",   "color": Color("#16a34a")},
	"ramp":     {"label": "📐 Rampa",      "color": Color("#d97706")},
	"wall":     {"label": "🧱 Pared",      "color": Color("#6b7280")},
	"platform": {"label": "🟩 Plataforma","color": Color("#15803d")}
}

func _ready() -> void:
	_build_world()
	_build_camera()
	_build_hud()

func _build_world() -> void:
	var env_node = WorldEnvironment.new()
	var env = Environment.new()
	env.background_mode = Environment.BG_SKY
	var sky = Sky.new()
	var mat = ProceduralSkyMaterial.new()
	mat.sky_top_color     = Color("#0d1b2a")
	mat.sky_horizon_color = Color("#1b3a5c")
	mat.ground_horizon_color = Color("#1b3a5c")
	mat.ground_bottom_color  = Color("#0a1628")
	sky.sky_material = mat
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.7
	env_node.environment = env
	add_child(env_node)

	var sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-55, 20, 0)
	sun.light_energy = 1.4
	sun.shadow_enabled = true
	add_child(sun)

	# Grid / suelo
	var grid_body = StaticBody3D.new()
	grid_body.position.y = -0.05
	add_child(grid_body)

	var grid_mesh = MeshInstance3D.new()
	var plane = PlaneMesh.new()
	plane.size = Vector2(100, 100)
	grid_mesh.mesh = plane
	var grid_mat = StandardMaterial3D.new()
	grid_mat.albedo_color = Color("#111827")
	grid_mat.roughness = 1.0
	grid_mesh.set_surface_override_material(0, grid_mat)
	grid_body.add_child(grid_mesh)

	var col = CollisionShape3D.new()
	var shape = BoxShape3D.new()
	shape.size = Vector3(100, 0.1, 100)
	col.shape = shape
	grid_body.add_child(col)

	# Líneas de cuadrícula decorativas
	for i in range(-10, 11):
		_add_grid_line(Vector3(float(i)*2, 0, 0), Vector3(0.02, 0.01, 40))
		_add_grid_line(Vector3(0, 0, float(i)*2), Vector3(40, 0.01, 0.02))

func _add_grid_line(pos: Vector3, size: Vector3) -> void:
	var mi = MeshInstance3D.new()
	mi.position = pos
	var box = BoxMesh.new()
	box.size = size
	mi.mesh = box
	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color(0.2, 0.2, 0.3, 0.5)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mi.set_surface_override_material(0, mat)
	add_child(mi)

func _build_camera() -> void:
	_camera_pivot = Node3D.new()
	_camera_pivot.position = Vector3(0, 0, 0)
	add_child(_camera_pivot)

	_camera = Camera3D.new()
	_camera.near = 0.1
	_camera_pivot.add_child(_camera)
	_update_camera()

func _update_camera() -> void:
	if not _camera_pivot:
		return
	_camera_pivot.rotation.y = _cam_yaw
	_camera_pivot.rotation.x = _cam_pitch
	_camera.position.z = _cam_dist

func _build_hud() -> void:
	_hud = CanvasLayer.new()
	add_child(_hud)

	# ── Barra superior ────────────────────────────────────────────────────────
	var topbar = PanelContainer.new()
	topbar.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	topbar.custom_minimum_size = Vector2(0, 52)
	var ts = StyleBoxFlat.new()
	ts.bg_color = Color("#0f172a")
	ts.border_width_bottom = 1
	ts.border_color = Color("#1e3a5f")
	ts.content_margin_left   = 16
	ts.content_margin_top    = 8
	ts.content_margin_right  = 16
	ts.content_margin_bottom = 8
	topbar.add_theme_stylebox_override("panel", ts)
	_hud.add_child(topbar)

	var top_hbox = HBoxContainer.new()
	top_hbox.add_theme_constant_override("separation", 10)
	topbar.add_child(top_hbox)

	var back_btn = _make_btn("← Menú", Color("#374151"))
	back_btn.pressed.connect(func(): GameManager.go_to_main())
	top_hbox.add_child(back_btn)

	var title_lbl = Label.new()
	title_lbl.text = "🔧 STUDIO"
	title_lbl.add_theme_color_override("font_color", Color.WHITE)
	title_lbl.add_theme_font_size_override("font_size", 18)
	title_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	top_hbox.add_child(title_lbl)

	var clear_btn = _make_btn("🗑 Limpiar", Color("#7f1d1d"))
	clear_btn.pressed.connect(_clear_objects)
	top_hbox.add_child(clear_btn)

	var play_btn = _make_btn("▶ Probar", Color("#166534"))
	play_btn.pressed.connect(func(): GameManager.go_to_game_world({"title": "Mi Mundo"}))
	top_hbox.add_child(play_btn)

	# ── Toolbar izquierda — tipos de objeto ───────────────────────────────────
	var left_panel = PanelContainer.new()
	left_panel.set_anchors_and_offsets_preset(Control.PRESET_LEFT_WIDE)
	left_panel.offset_top    = 52
	left_panel.offset_right  = 180
	left_panel.offset_bottom = 0
	var lps = StyleBoxFlat.new()
	lps.bg_color = Color("#111827")
	lps.border_width_right = 1
	lps.border_color = Color("#1e3a5f")
	lps.content_margin_left   = 10
	lps.content_margin_top    = 14
	lps.content_margin_right  = 10
	lps.content_margin_bottom = 14
	left_panel.add_theme_stylebox_override("panel", lps)
	_hud.add_child(left_panel)

	var left_vbox = VBoxContainer.new()
	left_vbox.add_theme_constant_override("separation", 6)
	left_panel.add_child(left_vbox)

	var obj_title = Label.new()
	obj_title.text = "OBJETOS"
	obj_title.add_theme_color_override("font_color", Color("#9ca3af"))
	obj_title.add_theme_font_size_override("font_size", 11)
	left_vbox.add_child(obj_title)

	for obj_key in OBJECT_TYPES:
		var info = OBJECT_TYPES[obj_key]
		var btn = Button.new()
		btn.text = info["label"]
		btn.custom_minimum_size = Vector2(0, 38)
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		var s = StyleBoxFlat.new()
		s.bg_color = Color("#1f2937")
		s.corner_radius_top_left    = 6
		s.corner_radius_top_right   = 6
		s.corner_radius_bottom_left = 6
		s.corner_radius_bottom_right = 6
		s.content_margin_left = 10
		btn.add_theme_stylebox_override("normal", s)
		var sh = s.duplicate(); sh.bg_color = Color("#2563eb")
		btn.add_theme_stylebox_override("hover", sh)
		btn.add_theme_color_override("font_color", Color.WHITE)
		btn.add_theme_font_size_override("font_size", 13)
		btn.pressed.connect(func(): _select_object_type(obj_key))
		left_vbox.add_child(btn)

	var sep = HSeparator.new()
	sep.add_theme_color_override("color", Color("#1f2937"))
	left_vbox.add_child(sep)

	# Color picker
	var color_lbl = Label.new()
	color_lbl.text = "COLOR"
	color_lbl.add_theme_color_override("font_color", Color("#9ca3af"))
	color_lbl.add_theme_font_size_override("font_size", 11)
	left_vbox.add_child(color_lbl)

	var color_picker = ColorPickerButton.new()
	color_picker.color = _selected_color
	color_picker.custom_minimum_size = Vector2(0, 40)
	color_picker.color_changed.connect(func(c): _selected_color = c)
	left_vbox.add_child(color_picker)

	# ── Status bar inferior ───────────────────────────────────────────────────
	_status_label = Label.new()
	_status_label.text = "Click izquierdo: Colocar  |  Click derecho: Eliminar  |  Rueda: Zoom  |  Botón medio / Alt+arrastrar: Rotar"
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	_status_label.offset_bottom = 0
	_status_label.offset_top    = -26
	_status_label.add_theme_color_override("font_color", Color(1, 1, 1, 0.4))
	_status_label.add_theme_font_size_override("font_size", 11)
	_hud.add_child(_status_label)

func _select_object_type(key: String) -> void:
	_selected_object_type = key
	_selected_color = OBJECT_TYPES[key]["color"]

# ── Input ─────────────────────────────────────────────────────────────────────

func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_cam_dist = max(3.0, _cam_dist - 1.5)
			_update_camera()
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_cam_dist = min(60.0, _cam_dist + 1.5)
			_update_camera()
		elif event.button_index == MOUSE_BUTTON_MIDDLE:
			_orbit_drag = event.pressed
			_last_mouse = event.position
		elif event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			_try_place()
		elif event.button_index == MOUSE_BUTTON_RIGHT and event.pressed:
			_try_delete()

	if event is InputEventMouseMotion:
		if _orbit_drag or (Input.is_key_pressed(KEY_ALT) and Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)):
			_cam_yaw   -= event.relative.x * 0.008
			_cam_pitch = clamp(_cam_pitch - event.relative.y * 0.008, -1.2, -0.05)
			_update_camera()

func _try_place() -> void:
	var ray = _get_mouse_ray()
	if ray.is_empty():
		return
	var pos = _snap_to_grid(ray["position"])
	_place_object(pos)

func _try_delete() -> void:
	var ray = _get_mouse_ray()
	if ray.is_empty():
		return
	if ray.has("collider"):
		var col = ray["collider"]
		if col is StaticBody3D and col.get_parent() != null:
			var parent = col.get_parent()
			if _placed_objects.has(parent):
				_placed_objects.erase(parent)
				parent.queue_free()

func _get_mouse_ray() -> Dictionary:
	var space = get_world_3d().direct_space_state
	var from = _camera.project_ray_origin(get_viewport().get_mouse_position())
	var to   = from + _camera.project_ray_normal(get_viewport().get_mouse_position()) * 200.0
	var params = PhysicsRayQueryParameters3D.create(from, to)
	return space.intersect_ray(params)

func _snap_to_grid(pos: Vector3) -> Vector3:
	return Vector3(round(pos.x), max(0.0, round(pos.y)), round(pos.z))

func _place_object(pos: Vector3) -> void:
	var body = StaticBody3D.new()
	body.position = pos + Vector3(0, 0.5, 0)
	add_child(body)

	var mi = MeshInstance3D.new()
	var mat = StandardMaterial3D.new()
	mat.albedo_color = _selected_color
	mat.roughness = 0.7

	match _selected_object_type:
		"box":
			var box = BoxMesh.new()
			box.size = Vector3(1, 1, 1)
			mi.mesh = box
			var col = CollisionShape3D.new()
			col.shape = BoxShape3D.new()
			body.add_child(col)
		"sphere":
			var sphere = SphereMesh.new()
			sphere.radius = 0.5
			sphere.height = 1.0
			mi.mesh = sphere
			var col = CollisionShape3D.new()
			var sph = SphereShape3D.new()
			sph.radius = 0.5
			col.shape = sph
			body.add_child(col)
		"cylinder":
			var cyl = CylinderMesh.new()
			cyl.top_radius = 0.5
			cyl.bottom_radius = 0.5
			cyl.height = 1.0
			mi.mesh = cyl
			var col = CollisionShape3D.new()
			var cs = CylinderShape3D.new()
			cs.radius = 0.5
			cs.height = 1.0
			col.shape = cs
			body.add_child(col)
		"ramp":
			var prism = PrismMesh.new()
			prism.size = Vector3(1, 1, 1)
			mi.mesh = prism
			var col = CollisionShape3D.new()
			col.shape = BoxShape3D.new()
			body.add_child(col)
		"wall":
			var wall_mesh = BoxMesh.new()
			wall_mesh.size = Vector3(2, 3, 0.3)
			mi.mesh = wall_mesh
			body.position = pos + Vector3(0, 1.5, 0)
			var col = CollisionShape3D.new()
			var ws = BoxShape3D.new()
			ws.size = Vector3(2, 3, 0.3)
			col.shape = ws
			body.add_child(col)
		"platform":
			var plat = BoxMesh.new()
			plat.size = Vector3(3, 0.3, 3)
			mi.mesh = plat
			body.position = pos + Vector3(0, 0.15, 0)
			var col = CollisionShape3D.new()
			var ps = BoxShape3D.new()
			ps.size = Vector3(3, 0.3, 3)
			col.shape = ps
			body.add_child(col)

	mi.set_surface_override_material(0, mat)
	body.add_child(mi)
	_placed_objects.append(body)

func _clear_objects() -> void:
	for obj in _placed_objects:
		if is_instance_valid(obj):
			obj.queue_free()
	_placed_objects.clear()

func _make_btn(text: String, color: Color) -> Button:
	var btn = Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(0, 36)
	var s = StyleBoxFlat.new()
	s.bg_color = color
	s.corner_radius_top_left    = 8
	s.corner_radius_top_right   = 8
	s.corner_radius_bottom_left = 8
	s.corner_radius_bottom_right = 8
	s.content_margin_left  = 14
	s.content_margin_right = 14
	btn.add_theme_stylebox_override("normal", s)
	var h = s.duplicate(); h.bg_color = color.lightened(0.1)
	btn.add_theme_stylebox_override("hover", h)
	btn.add_theme_color_override("font_color", Color.WHITE)
	btn.add_theme_font_size_override("font_size", 13)
	return btn
