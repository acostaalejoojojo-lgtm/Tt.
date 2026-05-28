extends Control

# ── Glidrovia Main Hub ────────────────────────────────────────────────────────

enum Tab { HOME, GAMES, AVATAR, FRIENDS, SETTINGS }
var _current_tab: Tab = Tab.HOME
var _content_area: Control
var _games_data: Array = []
var _tab_buttons: Dictionary = {}

func _ready() -> void:
	if not GameManager.is_authenticated:
		GameManager.go_to_login()
		return
	_build_ui()
	NetworkManager.get_games()
	NetworkManager.games_loaded.connect(_on_games_loaded)

func _build_ui() -> void:
	# Fondo
	var bg = ColorRect.new()
	bg.color = Color("#0f1014")
	bg.anchors_preset = Control.PRESET_FULL_RECT
	add_child(bg)

	# Layout principal: sidebar + contenido
	var hbox = HBoxContainer.new()
	hbox.anchors_preset = Control.PRESET_FULL_RECT
	hbox.add_theme_constant_override("separation", 0)
	add_child(hbox)

	# ── Sidebar ───────────────────────────────────────────────────────────────
	var sidebar = _build_sidebar()
	hbox.add_child(sidebar)

	# ── Área de contenido ─────────────────────────────────────────────────────
	_content_area = Control.new()
	_content_area.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_content_area.size_flags_vertical   = Control.SIZE_EXPAND_FILL
	hbox.add_child(_content_area)

	_show_tab(Tab.HOME)

func _build_sidebar() -> Control:
	var sidebar = PanelContainer.new()
	sidebar.custom_minimum_size = Vector2(220, 0)

	var style = StyleBoxFlat.new()
	style.bg_color = Color("#111318")
	style.border_width_right = 1
	style.border_color = Color("#1f2937")
	sidebar.add_theme_stylebox_override("panel", style)

	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)
	sidebar.add_child(vbox)

	# Avatar del jugador mini
	var profile_box = _make_profile_header()
	vbox.add_child(profile_box)

	var sep = HSeparator.new()
	sep.add_theme_color_override("color", Color("#1f2937"))
	vbox.add_child(sep)

	# Botones de navegación
	var tabs = [
		[Tab.HOME,     "🏠  Inicio"],
		[Tab.GAMES,    "🎮  Juegos"],
		[Tab.AVATAR,   "👤  Avatar"],
		[Tab.FRIENDS,  "👥  Amigos"],
		[Tab.SETTINGS, "⚙️  Ajustes"]
	]
	for tab_info in tabs:
		var btn = Button.new()
		btn.text = tab_info[1]
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.custom_minimum_size = Vector2(0, 44)
		_style_tab_btn(btn, false)
		btn.pressed.connect(_show_tab.bind(tab_info[0]))
		vbox.add_child(btn)
		_tab_buttons[tab_info[0]] = btn

	var spacer = Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(spacer)

	# Botón Salir
	var logout_btn = Button.new()
	logout_btn.text = "🚪  Cerrar Sesión"
	logout_btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
	logout_btn.custom_minimum_size = Vector2(0, 44)
	_style_tab_btn(logout_btn, false)
	logout_btn.add_theme_color_override("font_color", Color("#ef4444"))
	logout_btn.pressed.connect(GameManager.logout)
	vbox.add_child(logout_btn)

	return sidebar

func _make_profile_header() -> Control:
	var box = HBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0)
	style.content_margin_left   = 14
	style.content_margin_top    = 16
	style.content_margin_right  = 14
	style.content_margin_bottom = 16

	# Avatar mini (cuadrado de color)
	var avatar_rect = ColorRect.new()
	avatar_rect.color = GameManager.get_avatar_body_colors().get("torso", Color("#0047AB"))
	avatar_rect.custom_minimum_size = Vector2(42, 42)
	var corner = StyleBoxFlat.new()
	corner.bg_color = GameManager.get_avatar_body_colors().get("torso", Color("#0047AB"))
	corner.corner_radius_top_left    = 8
	corner.corner_radius_top_right   = 8
	corner.corner_radius_bottom_left = 8
	corner.corner_radius_bottom_right = 8
	box.add_child(avatar_rect)

	var info = VBoxContainer.new()
	info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	box.add_child(info)

	var name_lbl = Label.new()
	name_lbl.text = GameManager.get_display_name()
	name_lbl.add_theme_color_override("font_color", Color.WHITE)
	name_lbl.add_theme_font_size_override("font_size", 14)
	info.add_child(name_lbl)

	var rank_lbl = Label.new()
	rank_lbl.text = GameManager.get_rank()
	rank_lbl.add_theme_color_override("font_color", Color("#2563eb"))
	rank_lbl.add_theme_font_size_override("font_size", 11)
	info.add_child(rank_lbl)

	var drovis_lbl = Label.new()
	drovis_lbl.text = "💎 " + str(GameManager.get_drovis()) + " Drovis"
	drovis_lbl.add_theme_color_override("font_color", Color("#9ca3af"))
	drovis_lbl.add_theme_font_size_override("font_size", 11)
	info.add_child(drovis_lbl)

	return box

# ── Tabs ──────────────────────────────────────────────────────────────────────

func _show_tab(tab: Tab) -> void:
	_current_tab = tab
	for child in _content_area.get_children():
		child.queue_free()
	for t in _tab_buttons:
		_style_tab_btn(_tab_buttons[t], t == tab)

	match tab:
		Tab.HOME:     _build_home()
		Tab.GAMES:    _build_games()
		Tab.AVATAR:   GameManager.go_to_avatar_editor()
		Tab.FRIENDS:  _build_friends()
		Tab.SETTINGS: _build_settings()

func _build_home() -> void:
	var scroll = ScrollContainer.new()
	scroll.anchors_preset = Control.PRESET_FULL_RECT
	_content_area.add_child(scroll)

	var vbox = VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 24)
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0, 0, 0, 0)
	style.content_margin_left   = 32
	style.content_margin_top    = 28
	style.content_margin_right  = 32
	style.content_margin_bottom = 28
	scroll.add_child(vbox)

	# Bienvenida
	var welcome = Label.new()
	welcome.text = "¡Bienvenido, " + GameManager.get_display_name() + "!"
	welcome.add_theme_color_override("font_color", Color.WHITE)
	welcome.add_theme_font_size_override("font_size", 28)
	vbox.add_child(welcome)

	# Botones rápidos
	var btn_row = HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 12)
	vbox.add_child(btn_row)

	var play_btn = _make_big_button("▶  JUGAR", Color("#2563eb"))
	play_btn.pressed.connect(func():
		if GameManager.published_games.size() > 0:
			GameManager.go_to_game_world(GameManager.published_games[0])
		else:
			GameManager.go_to_game_world({})
	)
	btn_row.add_child(play_btn)

	var create_btn = _make_big_button("🔧  CREAR", Color("#7c3aed"))
	create_btn.pressed.connect(GameManager.go_to_studio)
	btn_row.add_child(create_btn)

	# Juegos destacados
	var games_title = Label.new()
	games_title.text = "Juegos Destacados"
	games_title.add_theme_color_override("font_color", Color.WHITE)
	games_title.add_theme_font_size_override("font_size", 20)
	vbox.add_child(games_title)

	var grid = GridContainer.new()
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", 16)
	grid.add_theme_constant_override("v_separation", 16)
	vbox.add_child(grid)

	if _games_data.is_empty():
		var loading = Label.new()
		loading.text = "Cargando juegos..."
		loading.add_theme_color_override("font_color", Color("#9ca3af"))
		grid.add_child(loading)
	else:
		for game in _games_data.slice(0, 6):
			grid.add_child(_make_game_card(game))

func _build_games() -> void:
	var scroll = ScrollContainer.new()
	scroll.anchors_preset = Control.PRESET_FULL_RECT
	_content_area.add_child(scroll)

	var vbox = VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 16)
	var mg = StyleBoxFlat.new()
	mg.bg_color = Color(0,0,0,0)
	mg.content_margin_left   = 32
	mg.content_margin_top    = 28
	mg.content_margin_right  = 32
	mg.content_margin_bottom = 28
	scroll.add_child(vbox)

	var title = Label.new()
	title.text = "Todos los Juegos"
	title.add_theme_color_override("font_color", Color.WHITE)
	title.add_theme_font_size_override("font_size", 24)
	vbox.add_child(title)

	var grid = GridContainer.new()
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", 16)
	grid.add_theme_constant_override("v_separation", 16)
	vbox.add_child(grid)

	if _games_data.is_empty():
		var lbl = Label.new()
		lbl.text = "No hay juegos publicados aún. ¡Crea el primero!"
		lbl.add_theme_color_override("font_color", Color("#9ca3af"))
		grid.add_child(lbl)
	else:
		for game in _games_data:
			grid.add_child(_make_game_card(game))

func _build_friends() -> void:
	var vbox = VBoxContainer.new()
	vbox.anchors_preset = Control.PRESET_FULL_RECT
	vbox.add_theme_constant_override("separation", 12)
	var mg = StyleBoxFlat.new()
	mg.bg_color = Color(0,0,0,0)
	mg.content_margin_left = 32
	mg.content_margin_top  = 28
	_content_area.add_child(vbox)

	var title = Label.new()
	title.text = "Amigos"
	title.add_theme_color_override("font_color", Color.WHITE)
	title.add_theme_font_size_override("font_size", 24)
	vbox.add_child(title)

	var friends = GameManager.friends_list
	if friends.is_empty():
		var lbl = Label.new()
		lbl.text = "Aún no tienes amigos. ¡Busca usuarios para agregarlos!"
		lbl.add_theme_color_override("font_color", Color("#9ca3af"))
		vbox.add_child(lbl)

func _build_settings() -> void:
	var vbox = VBoxContainer.new()
	vbox.anchors_preset = Control.PRESET_FULL_RECT
	vbox.add_theme_constant_override("separation", 16)
	_content_area.add_child(vbox)

	var title = Label.new()
	title.text = "Ajustes"
	title.add_theme_color_override("font_color", Color.WHITE)
	title.add_theme_font_size_override("font_size", 24)
	vbox.add_child(title)

	# URL del servidor
	var server_row = HBoxContainer.new()
	vbox.add_child(server_row)
	var server_lbl = Label.new()
	server_lbl.text = "URL del Servidor:"
	server_lbl.add_theme_color_override("font_color", Color("#9ca3af"))
	server_row.add_child(server_lbl)
	var server_field = LineEdit.new()
	server_field.text = NetworkManager.server_url
	server_field.custom_minimum_size = Vector2(300, 36)
	server_field.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	server_field.text_submitted.connect(func(t): NetworkManager.server_url = t)
	server_row.add_child(server_field)

	# Idioma
	var lang_row = HBoxContainer.new()
	vbox.add_child(lang_row)
	var lang_lbl = Label.new()
	lang_lbl.text = "Idioma:"
	lang_lbl.add_theme_color_override("font_color", Color("#9ca3af"))
	lang_row.add_child(lang_lbl)
	var lang_opt = OptionButton.new()
	lang_opt.add_item("Español", 0)
	lang_opt.add_item("English", 1)
	lang_opt.selected = 0 if GameManager.settings["language"] == "es" else 1
	lang_opt.item_selected.connect(func(idx): GameManager.settings["language"] = "es" if idx == 0 else "en")
	lang_row.add_child(lang_opt)

func _on_games_loaded(games: Array) -> void:
	_games_data = games
	if _current_tab == Tab.HOME:
		_show_tab(Tab.HOME)
	elif _current_tab == Tab.GAMES:
		_show_tab(Tab.GAMES)

# ── Helpers UI ────────────────────────────────────────────────────────────────

func _make_game_card(game: Dictionary) -> Control:
	var card = PanelContainer.new()
	card.custom_minimum_size = Vector2(200, 160)

	var style = StyleBoxFlat.new()
	style.bg_color = Color("#1a1b1e")
	style.border_color = Color("#2563eb")
	style.border_width_bottom = 2
	style.corner_radius_top_left    = 12
	style.corner_radius_top_right   = 12
	style.corner_radius_bottom_left = 12
	style.corner_radius_bottom_right = 12
	style.content_margin_left   = 14
	style.content_margin_top    = 12
	style.content_margin_right  = 14
	style.content_margin_bottom = 12
	card.add_theme_stylebox_override("panel", style)

	var vbox = VBoxContainer.new()
	card.add_child(vbox)

	var title = Label.new()
	title.text = game.get("title", "Sin título")
	title.add_theme_color_override("font_color", Color.WHITE)
	title.add_theme_font_size_override("font_size", 15)
	title.clip_text = true
	vbox.add_child(title)

	var creator = Label.new()
	creator.text = "por " + game.get("creator", "Desconocido")
	creator.add_theme_color_override("font_color", Color("#9ca3af"))
	creator.add_theme_font_size_override("font_size", 11)
	vbox.add_child(creator)

	var spacer = Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(spacer)

	var playing = Label.new()
	playing.text = "👥 " + str(game.get("playing", 0)) + " jugando"
	playing.add_theme_color_override("font_color", Color("#22c55e"))
	playing.add_theme_font_size_override("font_size", 12)
	vbox.add_child(playing)

	var play_btn = Button.new()
	play_btn.text = "Jugar"
	_style_small_btn(play_btn, Color("#2563eb"))
	play_btn.pressed.connect(func(): GameManager.go_to_game_world(game))
	vbox.add_child(play_btn)

	return card

func _make_big_button(text: String, color: Color) -> Button:
	var btn = Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(160, 54)
	var s = StyleBoxFlat.new()
	s.bg_color = color
	s.corner_radius_top_left    = 14
	s.corner_radius_top_right   = 14
	s.corner_radius_bottom_left = 14
	s.corner_radius_bottom_right = 14
	btn.add_theme_stylebox_override("normal", s)
	var h = s.duplicate(); h.bg_color = color.lightened(0.15)
	btn.add_theme_stylebox_override("hover", h)
	btn.add_theme_color_override("font_color", Color.WHITE)
	btn.add_theme_font_size_override("font_size", 16)
	return btn

func _style_small_btn(btn: Button, color: Color) -> void:
	var s = StyleBoxFlat.new()
	s.bg_color = color
	s.corner_radius_top_left    = 8
	s.corner_radius_top_right   = 8
	s.corner_radius_bottom_left = 8
	s.corner_radius_bottom_right = 8
	btn.add_theme_stylebox_override("normal", s)
	btn.add_theme_color_override("font_color", Color.WHITE)
	btn.add_theme_font_size_override("font_size", 13)

func _style_tab_btn(btn: Button, active: bool) -> void:
	var s = StyleBoxFlat.new()
	s.bg_color = Color("#2563eb") if active else Color(0,0,0,0)
	s.corner_radius_top_left    = 8
	s.corner_radius_top_right   = 8
	s.corner_radius_bottom_left = 8
	s.corner_radius_bottom_right = 8
	s.content_margin_left   = 18
	s.content_margin_top    = 10
	s.content_margin_right  = 18
	s.content_margin_bottom = 10
	btn.add_theme_stylebox_override("normal", s)
	btn.add_theme_stylebox_override("hover", s)
	btn.add_theme_stylebox_override("pressed", s)
	btn.add_theme_color_override("font_color", Color.WHITE if active else Color("#9ca3af"))
	btn.add_theme_font_size_override("font_size", 14)
