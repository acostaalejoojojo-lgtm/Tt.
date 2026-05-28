extends Control

# ── Glidrovia Login Screen ────────────────────────────────────────────────────

var _username_field: LineEdit
var _password_field: LineEdit
var _login_btn: Button
var _status_label: Label
var _loading: bool = false

func _ready() -> void:
	_build_ui()
	# Si ya hay sesión guardada, ir directo al menú
	if GameManager.is_authenticated:
		await get_tree().create_timer(0.5).timeout
		GameManager.go_to_main()

func _build_ui() -> void:
	# Fondo
	var bg = ColorRect.new()
	bg.color = Color("#0a0a0f")
	bg.anchors_preset = Control.PRESET_FULL_RECT
	add_child(bg)

	# Fondo gradiente decorativo
	var glow = ColorRect.new()
	glow.color = Color(0.15, 0.3, 0.8, 0.12)
	glow.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	glow.size = Vector2(600, 600)
	glow.position = Vector2(-300, -300)
	bg.add_child(glow)

	# Centro contenedor
	var center = CenterContainer.new()
	center.anchors_preset = Control.PRESET_FULL_RECT
	add_child(center)

	var card = PanelContainer.new()
	card.custom_minimum_size = Vector2(420, 0)
	center.add_child(card)

	var style = StyleBoxFlat.new()
	style.bg_color = Color("#111318")
	style.border_color = Color("#2563eb")
	style.border_width_left = 1
	style.border_width_right = 1
	style.border_width_top = 1
	style.border_width_bottom = 1
	style.corner_radius_top_left = 20
	style.corner_radius_top_right = 20
	style.corner_radius_bottom_left = 20
	style.corner_radius_bottom_right = 20
	style.content_margin_left = 40
	style.content_margin_right = 40
	style.content_margin_top = 40
	style.content_margin_bottom = 40
	card.add_theme_stylebox_override("panel", style)

	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 18)
	card.add_child(vbox)

	# Logo / Título
	var title = Label.new()
	title.text = "GLIDROVIA"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 42)
	title.add_theme_color_override("font_color", Color("#2563eb"))
	vbox.add_child(title)

	var subtitle = Label.new()
	subtitle.text = "Construye tu Realidad"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 13)
	subtitle.add_theme_color_override("font_color", Color("#4b5563"))
	vbox.add_child(subtitle)

	var sep = HSeparator.new()
	sep.add_theme_color_override("color", Color("#1f2937"))
	vbox.add_child(sep)

	# Campo usuario
	var user_lbl = Label.new()
	user_lbl.text = "Usuario"
	user_lbl.add_theme_color_override("font_color", Color("#9ca3af"))
	user_lbl.add_theme_font_size_override("font_size", 13)
	vbox.add_child(user_lbl)

	_username_field = LineEdit.new()
	_username_field.placeholder_text = "Escribe tu usuario..."
	_username_field.custom_minimum_size = Vector2(0, 48)
	_style_input(_username_field)
	_username_field.text_submitted.connect(_on_login_pressed.bind(""))
	vbox.add_child(_username_field)

	# Campo contraseña
	var pass_lbl = Label.new()
	pass_lbl.text = "Contraseña (opcional)"
	pass_lbl.add_theme_color_override("font_color", Color("#9ca3af"))
	pass_lbl.add_theme_font_size_override("font_size", 13)
	vbox.add_child(pass_lbl)

	_password_field = LineEdit.new()
	_password_field.placeholder_text = "Contraseña..."
	_password_field.secret = true
	_password_field.custom_minimum_size = Vector2(0, 48)
	_style_input(_password_field)
	_password_field.text_submitted.connect(_on_login_pressed)
	vbox.add_child(_password_field)

	# Botón entrar
	_login_btn = Button.new()
	_login_btn.text = "ENTRAR"
	_login_btn.custom_minimum_size = Vector2(0, 52)
	_style_button(_login_btn, Color("#2563eb"))
	_login_btn.pressed.connect(func(): _on_login_pressed(""))
	vbox.add_child(_login_btn)

	# Botón invitado
	var guest_btn = Button.new()
	guest_btn.text = "Entrar como Invitado"
	guest_btn.custom_minimum_size = Vector2(0, 42)
	_style_button(guest_btn, Color("#1f2937"))
	guest_btn.pressed.connect(func(): _do_login("Invitado", ""))
	vbox.add_child(guest_btn)

	# Estado / error
	_status_label = Label.new()
	_status_label.text = ""
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_status_label.add_theme_font_size_override("font_size", 12)
	_status_label.add_theme_color_override("font_color", Color("#ef4444"))
	_status_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(_status_label)

	# URL del servidor
	var server_lbl = Label.new()
	server_lbl.text = "Servidor: " + NetworkManager.server_url
	server_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	server_lbl.add_theme_font_size_override("font_size", 10)
	server_lbl.add_theme_color_override("font_color", Color("#374151"))
	vbox.add_child(server_lbl)

func _on_login_pressed(_text: String) -> void:
	var username = _username_field.text.strip_edges()
	var password = _password_field.text
	if username.is_empty():
		_status_label.text = "Escribe un nombre de usuario"
		return
	_do_login(username, password)

func _do_login(username: String, password: String) -> void:
	if _loading:
		return
	_loading = true
	_login_btn.text = "Conectando..."
	_login_btn.disabled = true
	_status_label.text = ""

	NetworkManager.login_completed.connect(_on_login_result, CONNECT_ONE_SHOT)
	NetworkManager.login(username, password)

func _on_login_result(user_data: Dictionary, success: bool) -> void:
	_loading = false
	_login_btn.text = "ENTRAR"
	_login_btn.disabled = false
	if success:
		GameManager.go_to_main()
	else:
		_status_label.text = "No se pudo conectar al servidor. Comprueba tu conexión."

func _style_input(field: LineEdit) -> void:
	var s = StyleBoxFlat.new()
	s.bg_color = Color("#1f2937")
	s.border_color = Color("#374151")
	s.border_width_bottom = 2
	s.corner_radius_top_left = 10
	s.corner_radius_top_right = 10
	s.corner_radius_bottom_left = 10
	s.corner_radius_bottom_right = 10
	s.content_margin_left = 14
	s.content_margin_right = 14
	s.content_margin_top = 10
	s.content_margin_bottom = 10
	field.add_theme_stylebox_override("normal", s)
	field.add_theme_stylebox_override("focus", s)
	field.add_theme_color_override("font_color", Color.WHITE)
	field.add_theme_color_override("font_placeholder_color", Color("#4b5563"))
	field.add_theme_font_size_override("font_size", 15)

func _style_button(btn: Button, color: Color) -> void:
	var s = StyleBoxFlat.new()
	s.bg_color = color
	s.corner_radius_top_left = 12
	s.corner_radius_top_right = 12
	s.corner_radius_bottom_left = 12
	s.corner_radius_bottom_right = 12
	btn.add_theme_stylebox_override("normal", s)
	var h = s.duplicate()
	h.bg_color = color.lightened(0.15)
	btn.add_theme_stylebox_override("hover", h)
	var p = s.duplicate()
	p.bg_color = color.darkened(0.1)
	btn.add_theme_stylebox_override("pressed", p)
	btn.add_theme_color_override("font_color", Color.WHITE)
	btn.add_theme_font_size_override("font_size", 15)
