extends Node

# ── Glidrovia NetworkManager — HTTP + WebSocket ───────────────────────────────
# Connects to the Glidrovia Express backend server.

signal login_completed(user_data: Dictionary, success: bool)
signal games_loaded(games: Array)
signal users_loaded(users: Array)
signal request_failed(endpoint: String, error: String)

# Change this to your Replit server URL
var server_url: String = "https://gclu.worf.replit.dev"

var _http_pool: Array[HTTPRequest] = []
var _pending: Dictionary = {}

func _ready() -> void:
	# Pre-warm HTTP request pool
	for i in 3:
		var hr = HTTPRequest.new()
		add_child(hr)
		_http_pool.append(hr)

# ── Public API ────────────────────────────────────────────────────────────────

func login(username: String, password: String = "") -> void:
	var body = JSON.stringify({"username": username, "password": password})
	_post("/api/login", body, func(data): 
		GameManager.login(data)
		emit_signal("login_completed", data, true)
	, func(err):
		emit_signal("login_completed", {}, false)
		emit_signal("request_failed", "/api/login", err)
	)

func get_games() -> void:
	_get("/api/games", func(data):
		if data is Array:
			GameManager.published_games = data
			emit_signal("games_loaded", data)
	, func(err):
		emit_signal("request_failed", "/api/games", err)
	)

func get_recommended_users() -> void:
	_get("/api/recommended-users", func(data):
		if data is Array:
			emit_signal("users_loaded", data)
	, func(err):
		emit_signal("request_failed", "/api/recommended-users", err)
	)

func update_avatar(username: String, config: Dictionary) -> void:
	var body = JSON.stringify(config)
	_post("/api/user/" + username + "/avatar", body, func(_d): pass, func(_e): pass)

func get_global_settings() -> void:
	_get("/api/global-settings", func(data):
		if data is Dictionary and data.has("global_avatar_replacement"):
			pass
	, func(_e): pass)

# ── HTTP Helpers ──────────────────────────────────────────────────────────────

func _get(endpoint: String, on_success: Callable, on_error: Callable) -> void:
	_request("GET", endpoint, "", on_success, on_error)

func _post(endpoint: String, body: String, on_success: Callable, on_error: Callable) -> void:
	_request("POST", endpoint, body, on_success, on_error)

func _request(method: String, endpoint: String, body: String, on_success: Callable, on_error: Callable) -> void:
	var hr = HTTPRequest.new()
	add_child(hr)
	
	var headers = ["Content-Type: application/json"]
	var url = server_url + endpoint
	var http_method = HTTPClient.METHOD_GET if method == "GET" else HTTPClient.METHOD_POST
	
	hr.request_completed.connect(func(result, code, _headers, response_body):
		hr.queue_free()
		if result != HTTPRequest.RESULT_SUCCESS or code < 200 or code >= 300:
			on_error.call("HTTP %d" % code)
			return
		var text = response_body.get_string_from_utf8()
		var parsed = JSON.parse_string(text)
		if parsed == null:
			on_error.call("JSON parse error")
			return
		on_success.call(parsed)
	)
	
	var err = hr.request(url, headers, http_method, body)
	if err != OK:
		hr.queue_free()
		on_error.call("Request error: %d" % err)
