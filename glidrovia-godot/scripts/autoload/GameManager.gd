extends Node

# ── Glidrovia GameManager — Global State Singleton ───────────────────────────
# Persists across scene changes. Stores user, avatar, settings.

signal user_logged_in(user_data: Dictionary)
signal user_logged_out
signal avatar_updated(config: Dictionary)
signal scene_changed(scene_name: String)

# Current logged-in user
var current_user: Dictionary = {}
var is_authenticated: bool = false

# Avatar configuration
var avatar_config: Dictionary = {
	"body_colors": {
		"head": Color("#F5CD30"),
		"torso": Color("#0047AB"),
		"left_arm": Color("#F5CD30"),
		"right_arm": Color("#F5CD30"),
		"left_leg": Color("#A2C429"),
		"right_leg": Color("#A2C429")
	},
	"custom_model_url": "",
	"hat_model_url": "",
	"shirt_texture_url": "",
	"face_texture_url": ""
}

# App settings
var settings: Dictionary = {
	"language": "es",
	"region": "Global",
	"background_color": Color("#1a1b1e"),
	"music_volume": 0.8,
	"sfx_volume": 1.0
}

# Games and data cache
var published_games: Array = []
var friends_list: Array = []
var current_game: Dictionary = {}

# Save file path
const SAVE_PATH = "user://glidrovia_save.cfg"

func _ready() -> void:
	load_save()

# ── Scene Navigation ──────────────────────────────────────────────────────────

func go_to_login() -> void:
	get_tree().change_scene_to_file("res://scenes/Login.tscn")
	emit_signal("scene_changed", "Login")

func go_to_main() -> void:
	get_tree().change_scene_to_file("res://scenes/Main.tscn")
	emit_signal("scene_changed", "Main")

func go_to_avatar_editor() -> void:
	get_tree().change_scene_to_file("res://scenes/AvatarEditor.tscn")
	emit_signal("scene_changed", "AvatarEditor")

func go_to_studio() -> void:
	get_tree().change_scene_to_file("res://scenes/Studio.tscn")
	emit_signal("scene_changed", "Studio")

func go_to_game_world(game_data: Dictionary = {}) -> void:
	current_game = game_data
	get_tree().change_scene_to_file("res://scenes/GameWorld.tscn")
	emit_signal("scene_changed", "GameWorld")

# ── User Session ──────────────────────────────────────────────────────────────

func login(user_data: Dictionary) -> void:
	current_user = user_data
	is_authenticated = true
	if user_data.has("avatar_config"):
		_apply_avatar_config(user_data["avatar_config"])
	if user_data.has("settings"):
		settings.merge(user_data["settings"], true)
	save_data()
	emit_signal("user_logged_in", user_data)

func logout() -> void:
	current_user = {}
	is_authenticated = false
	var config = ConfigFile.new()
	config.save(SAVE_PATH)
	emit_signal("user_logged_out")
	go_to_login()

func get_username() -> String:
	return current_user.get("username", "Invitado")

func get_display_name() -> String:
	return current_user.get("displayName", get_username())

func get_drovis() -> int:
	return current_user.get("drovis", 0)

func get_robux() -> int:
	return current_user.get("robux", 0)

func get_rank() -> String:
	return current_user.get("rank", "Standard")

func is_admin() -> bool:
	return current_user.get("isAdmin", false)

# ── Avatar ────────────────────────────────────────────────────────────────────

func update_avatar(config: Dictionary) -> void:
	_apply_avatar_config(config)
	if current_user.has("username"):
		NetworkManager.update_avatar(current_user["username"], config)
	save_data()
	emit_signal("avatar_updated", avatar_config)

func _apply_avatar_config(config: Dictionary) -> void:
	if config.has("bodyColors"):
		var bc = config["bodyColors"]
		if bc.has("head"):       avatar_config["body_colors"]["head"]      = Color(bc["head"])
		if bc.has("torso"):      avatar_config["body_colors"]["torso"]     = Color(bc["torso"])
		if bc.has("leftArm"):    avatar_config["body_colors"]["left_arm"]  = Color(bc["leftArm"])
		if bc.has("rightArm"):   avatar_config["body_colors"]["right_arm"] = Color(bc["rightArm"])
		if bc.has("leftLeg"):    avatar_config["body_colors"]["left_leg"]  = Color(bc["leftLeg"])
		if bc.has("rightLeg"):   avatar_config["body_colors"]["right_leg"] = Color(bc["rightLeg"])
	if config.has("customModelUrl"):
		avatar_config["custom_model_url"] = config["customModelUrl"]

func get_avatar_body_colors() -> Dictionary:
	return avatar_config["body_colors"]

# ── Persistence ───────────────────────────────────────────────────────────────

func save_data() -> void:
	var config = ConfigFile.new()
	config.set_value("user", "username", current_user.get("username", ""))
	config.set_value("user", "display_name", current_user.get("displayName", ""))
	config.set_value("user", "robux", current_user.get("robux", 0))
	config.set_value("user", "drovis", current_user.get("drovis", 0))
	config.set_value("user", "rank", current_user.get("rank", "Standard"))
	config.set_value("avatar", "head_color",      avatar_config["body_colors"]["head"].to_html())
	config.set_value("avatar", "torso_color",     avatar_config["body_colors"]["torso"].to_html())
	config.set_value("avatar", "left_arm_color",  avatar_config["body_colors"]["left_arm"].to_html())
	config.set_value("avatar", "right_arm_color", avatar_config["body_colors"]["right_arm"].to_html())
	config.set_value("avatar", "left_leg_color",  avatar_config["body_colors"]["left_leg"].to_html())
	config.set_value("avatar", "right_leg_color", avatar_config["body_colors"]["right_leg"].to_html())
	config.set_value("settings", "language", settings["language"])
	config.set_value("settings", "region",   settings["region"])
	config.save(SAVE_PATH)

func load_save() -> void:
	var config = ConfigFile.new()
	if config.load(SAVE_PATH) != OK:
		return
	var username = config.get_value("user", "username", "")
	if username != "":
		current_user = {
			"username":    username,
			"displayName": config.get_value("user", "display_name", username),
			"robux":       config.get_value("user", "robux", 0),
			"drovis":      config.get_value("user", "drovis", 0),
			"rank":        config.get_value("user", "rank", "Standard")
		}
		is_authenticated = true
	avatar_config["body_colors"]["head"]      = Color("#" + config.get_value("avatar", "head_color",      "F5CD30"))
	avatar_config["body_colors"]["torso"]     = Color("#" + config.get_value("avatar", "torso_color",     "0047AB"))
	avatar_config["body_colors"]["left_arm"]  = Color("#" + config.get_value("avatar", "left_arm_color",  "F5CD30"))
	avatar_config["body_colors"]["right_arm"] = Color("#" + config.get_value("avatar", "right_arm_color", "F5CD30"))
	avatar_config["body_colors"]["left_leg"]  = Color("#" + config.get_value("avatar", "left_leg_color",  "A2C429"))
	avatar_config["body_colors"]["right_leg"] = Color("#" + config.get_value("avatar", "right_leg_color", "A2C429"))
	settings["language"] = config.get_value("settings", "language", "es")
	settings["region"]   = config.get_value("settings", "region",   "Global")
