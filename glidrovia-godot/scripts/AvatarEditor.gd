extends Control

# ── Glidrovia Avatar Editor ───────────────────────────────────────────────────

var _avatar_viewport: SubViewport
var _avatar_node: Node3D
var _colors: Dictionary = {}
var _color_buttons: Dictionary = {}

const PARTS = [
	["head",      "Cabeza"],
	["torso",     "Torso"],
	["left_arm",  "Brazo Izq."],
	["right_arm", "Brazo Der."],
	["left_leg",  "Pierna Izq."],
	["right_leg", "Pierna Der."]
]

func _ready() -> void:
	_colors = GameManager.get_avatar_body_colors().duplicate(true)
	_build_ui()

func _build_ui() -> void:
	var bg = ColorRect.new()
	bg.color = Color("#0f1014")
	bg.anchors_preset = Control.PRESET_FULL_RECT
	add_child(bg)

	# Barra superior
	var topbar = _make_topbar()
	add_child(topbar)

	# Contenido principal
	var hbox = HBoxContainer.new()
	hbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hbox.offset_top = 60
	hbox.add_theme_constant_override("separation", 0)
	add_child(hbox)

	# Panel izquierdo — controles de color
	var left_panel = _build_left_panel()
	hbox.add_child(left_panel)

	# Panel derecho — preview 3D
	var right_panel = _build_3d_preview()
	hbox.add_child(right_panel)

func _make_topbar() -> Control:
	var bar = PanelContainer.new()
	bar.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	bar.custom_minimum_size = Vector2(0, 60)

	var style = StyleBoxFlat.new()
	style.bg_color = Color("#111318")
	style.border_width_bottom = 1
	style.border_color = Color("#1f2937")
	style.content_margin_left   = 20
	style.content_margin_top    = 10
	style.content_margin_right  = 20
	style.content_margin_bottom = 10
	bar.add_theme_stylebox_override("panel", style)

	var hbox = HBoxContainer.new()
	bar.add_child(hbox)

	var back_btn = Button.new()
	back_btn.text = "← Volver"
	_style_btn(back_btn, Color("#1f2937"))
	back_btn.pressed.connect(GameManager.go_to_main)
	hbox.add_child(back_btn)

	var title = Label.new()
	title.text = "Editor de Avatar"
	title.add_theme_color_override("font_color", Color.WHITE)
	title.add_theme_font_size_override("font_size", 18)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hbox.add_child(title)

	var save_btn = Button.new()
	save_btn.text = "💾 Guardar"
	_style_btn(save_btn, Color("#2563eb"))
	save_btn.pressed.connect(_save_avatar)
	hbox.add_child(save_btn)

	return bar

func _build_left_panel() -> Control:
	var scroll = ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(300, 0)

	var style = StyleBoxFlat.new()
	style.bg_color = Color("#111318")
	style.border_width_right = 1
	style.border_color = Color("#1f2937")
	scroll.add_theme_stylebox_override("panel", style)

	var vbox = VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 8)
	var mg = StyleBoxFlat.new()
	mg.bg_color = Color(0,0,0,0)
	mg.content_margin_left   = 20
	mg.content_margin_top    = 20
	mg.content_margin_right  = 20
	mg.content_margin_bottom = 20
	scroll.add_child(vbox)

	var title = Label.new()
	title.text = "Colores del Cuerpo"
	title.add_theme_color_override("font_color", Color.WHITE)
	title.add_theme_font_size_override("font_size", 16)
	vbox.add_child(title)

	# Fila de color para cada parte
	for part_info in PARTS:
		var key = part_info[0]
		var label_text = part_info[1]
		var row = HBoxContainer.new()
		row.add_theme_constant_override("separation", 12)
		vbox.add_child(row)

		var lbl = Label.new()
		lbl.text = label_text
		lbl.custom_minimum_size = Vector2(110, 0)
		lbl.add_theme_color_override("font_color", Color("#9ca3af"))
		lbl.add_theme_font_size_override("font_size", 13)
		row.add_child(lbl)

		var color_btn = ColorPickerButton.new()
		color_btn.color = _colors.get(key, Color.WHITE)
		color_btn.custom_minimum_size = Vector2(80, 36)
		color_btn.color_changed.connect(func(c): _on_color_changed(key, c))
		_color_buttons[key] = color_btn
		row.add_child(color_btn)

	# Presets rápidos
	var preset_title = Label.new()
	preset_title.text = "Presets Rápidos"
	preset_title.add_theme_color_override("font_color", Color.WHITE)
	preset_title.add_theme_font_size_override("font_size", 14)
	vbox.add_child(preset_title)

	var presets = [
		["Clásico",   {"head":"#F5CD30","torso":"#0047AB","left_arm":"#F5CD30","right_arm":"#F5CD30","left_leg":"#A2C429","right_leg":"#A2C429"}],
		["Rojo",      {"head":"#FF6B6B","torso":"#C0392B","left_arm":"#FF6B6B","right_arm":"#FF6B6B","left_leg":"#E74C3C","right_leg":"#E74C3C"}],
		["Verde",     {"head":"#A8E6CF","torso":"#27AE60","left_arm":"#A8E6CF","right_arm":"#A8E6CF","left_leg":"#2ECC71","right_leg":"#2ECC71"}],
		["Morado",    {"head":"#D7BDE2","torso":"#8E44AD","left_arm":"#D7BDE2","right_arm":"#D7BDE2","left_leg":"#9B59B6","right_leg":"#9B59B6"}],
		["Naranja",   {"head":"#FDEBD0","torso":"#E67E22","left_arm":"#FDEBD0","right_arm":"#FDEBD0","left_leg":"#F39C12","right_leg":"#F39C12"}],
		["Negro",     {"head":"#95A5A6","torso":"#2C3E50","left_arm":"#95A5A6","right_arm":"#95A5A6","left_leg":"#34495E","right_leg":"#34495E"}]
	]

	var preset_grid = GridContainer.new()
	preset_grid.columns = 3
	preset_grid.add_theme_constant_override("h_separation", 8)
	preset_grid.add_theme_constant_override("v_separation", 8)
	vbox.add_child(preset_grid)

	for preset in presets:
		var btn = Button.new()
		btn.text = preset[0]
		btn.custom_minimum_size = Vector2(80, 36)
		var pcolors = preset[1]
		_style_btn(btn, Color(pcolors["torso"]))
		btn.pressed.connect(func(): _apply_preset(pcolors))
		preset_grid.add_child(btn)

	return scroll

func _build_3d_preview() -> Control:
	var container = Control.new()
	container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	container.size_flags_vertical   = Control.SIZE_EXPAND_FILL

	_avatar_viewport = SubViewport.new()
	_avatar_viewport.size = Vector2i(600, 700)
	_avatar_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	_avatar_viewport.transparent_bg = true
	container.add_child(_avatar_viewport)

	# Escena 3D dentro del viewport
	var world = Node3D.new()
	_avatar_viewport.add_child(world)

	# Luz
	var light = DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-45, 30, 0)
	light.light_energy = 1.5
	world.add_child(light)

	var ambient = WorldEnvironment.new()
	var env = Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#1a1b2e")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.3, 0.3, 0.4)
	env.ambient_light_energy = 0.8
	ambient.environment = env
	world.add_child(ambient)

	# Cámara
	var camera = Camera3D.new()
	camera.position = Vector3(0, 1.5, 5.5)
	camera.look_at_from_position(camera.position, Vector3(0, 1.0, 0))
	world.add_child(camera)

	# Avatar
	var avatar_script = load("res://scripts/Avatar3D.gd")
	_avatar_node = Node3D.new()
	_avatar_node.set_script(avatar_script)
	world.add_child(_avatar_node)

	# SubViewportContainer para mostrar el render
	var vpc = SubViewportContainer.new()
	vpc.anchors_preset = Control.PRESET_FULL_RECT
	vpc.stretch = true
	vpc.add_child(_avatar_viewport)
	container.add_child(vpc)

	# Etiqueta de instrucción
	var hint = Label.new()
	hint.text = "Vista previa 3D en tiempo real"
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint.vertical_alignment = VERTICAL_ALIGNMENT_BOTTOM
	hint.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	hint.offset_bottom = 0
	hint.offset_top = -40
	hint.add_theme_color_override("font_color", Color("#4b5563"))
	hint.add_theme_font_size_override("font_size", 12)
	container.add_child(hint)

	return container

func _on_color_changed(part: String, color: Color) -> void:
	_colors[part] = color
	if _avatar_node and _avatar_node.has_method("set_body_colors"):
		_avatar_node.set_body_colors(_colors)

func _apply_preset(preset: Dictionary) -> void:
	for key in preset:
		_colors[key] = Color(preset[key])
		if _color_buttons.has(key):
			_color_buttons[key].color = _colors[key]
	if _avatar_node and _avatar_node.has_method("set_body_colors"):
		_avatar_node.set_body_colors(_colors)

func _save_avatar() -> void:
	var config = {
		"bodyColors": {
			"head":     _colors.get("head",      Color("#F5CD30")).to_html(false),
			"torso":    _colors.get("torso",     Color("#0047AB")).to_html(false),
			"leftArm":  _colors.get("left_arm",  Color("#F5CD30")).to_html(false),
			"rightArm": _colors.get("right_arm", Color("#F5CD30")).to_html(false),
			"leftLeg":  _colors.get("left_leg",  Color("#A2C429")).to_html(false),
			"rightLeg": _colors.get("right_leg", Color("#A2C429")).to_html(false)
		}
	}
	GameManager.update_avatar(config)
	GameManager.go_to_main()

func _style_btn(btn: Button, color: Color) -> void:
	var s = StyleBoxFlat.new()
	s.bg_color = color
	s.corner_radius_top_left    = 8
	s.corner_radius_top_right   = 8
	s.corner_radius_bottom_left = 8
	s.corner_radius_bottom_right = 8
	btn.add_theme_stylebox_override("normal", s)
	var h = s.duplicate(); h.bg_color = color.lightened(0.1)
	btn.add_theme_stylebox_override("hover", h)
	btn.add_theme_color_override("font_color", Color.WHITE)
	btn.add_theme_font_size_override("font_size", 13)
