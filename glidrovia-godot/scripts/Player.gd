extends CharacterBody3D

# ── Glidrovia Player — Controlador de personaje 3D ───────────────────────────

const WALK_SPEED    = 6.0
const SPRINT_SPEED  = 11.0
const JUMP_VELOCITY = 8.0
const GRAVITY       = 20.0
const MOUSE_SENS    = 0.003
const CAM_MIN_PITCH = -1.2
const CAM_MAX_PITCH = 0.8

var _camera_pivot: Node3D
var _camera: Camera3D
var _avatar: Node
var _name_label: Label3D

var _yaw: float   = 0.0
var _pitch: float = -0.3
var _mouse_captured: bool = false
var _is_on_ground: bool = false

func _ready() -> void:
	_build_player()
	_capture_mouse()

func _build_player() -> void:
	# Collision
	var col = CollisionShape3D.new()
	var cap = CapsuleShape3D.new()
	cap.radius = 0.45
	cap.height = 1.6
	col.shape = cap
	col.position.y = 1.2
	add_child(col)

	# Avatar 3D
	var avatar_script = load("res://scripts/Avatar3D.gd")
	_avatar = Node3D.new()
	_avatar.set_script(avatar_script)
	add_child(_avatar)

	# Etiqueta de nombre flotante
	_name_label = Label3D.new()
	_name_label.text = GameManager.get_display_name()
	_name_label.position = Vector3(0, 2.8, 0)
	_name_label.pixel_size = 0.008
	_name_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_name_label.modulate = Color.WHITE
	_name_label.outline_modulate = Color.BLACK
	_name_label.outline_render_priority = -1
	add_child(_name_label)

	# Cámara en tercera persona
	_camera_pivot = Node3D.new()
	_camera_pivot.position = Vector3(0, 1.8, 0)
	add_child(_camera_pivot)

	_camera = Camera3D.new()
	_camera.position = Vector3(0, 0.5, 5.5)
	_camera.near = 0.1
	_camera_pivot.add_child(_camera)

func _capture_mouse() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
	_mouse_captured = true

func _release_mouse() -> void:
	Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
	_mouse_captured = false

func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and _mouse_captured:
		_yaw   -= event.relative.x * MOUSE_SENS
		_pitch  = clamp(_pitch - event.relative.y * MOUSE_SENS, CAM_MIN_PITCH, CAM_MAX_PITCH)

	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_ESCAPE:
			if _mouse_captured:
				_release_mouse()
			else:
				_capture_mouse()
		if event.keycode == KEY_TAB:
			get_tree().change_scene_to_file("res://scenes/Main.tscn")

func _physics_process(delta: float) -> void:
	# Gravedad
	if not is_on_floor():
		velocity.y -= GRAVITY * delta
	else:
		if velocity.y < 0:
			velocity.y = 0.0

	# Salto
	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = JUMP_VELOCITY
		if _avatar and _avatar.has_method("set_jumping"):
			_avatar.set_jumping(true)

	if is_on_floor() and _avatar and _avatar.has_method("set_jumping"):
		_avatar.set_jumping(false)

	# Movimiento horizontal
	var speed = SPRINT_SPEED if Input.is_action_pressed("sprint") else WALK_SPEED
	var dir = Vector3.ZERO
	var cam_basis = Basis(Vector3.UP, _yaw)

	if Input.is_action_pressed("move_forward"):  dir -= cam_basis.z
	if Input.is_action_pressed("move_back"):     dir += cam_basis.z
	if Input.is_action_pressed("move_left"):     dir -= cam_basis.x
	if Input.is_action_pressed("move_right"):    dir += cam_basis.x

	dir = dir.normalized()

	if dir.length() > 0.1:
		velocity.x = dir.x * speed
		velocity.z = dir.z * speed
		# Girar avatar hacia donde se mueve
		var target_angle = atan2(dir.x, dir.z)
		if _avatar:
			_avatar.rotation.y = lerp_angle(_avatar.rotation.y, target_angle, 0.15)
		if _avatar and _avatar.has_method("set_walking"):
			_avatar.set_walking(true)
	else:
		velocity.x = lerp(velocity.x, 0.0, 0.2)
		velocity.z = lerp(velocity.z, 0.0, 0.2)
		if _avatar and _avatar.has_method("set_walking"):
			_avatar.set_walking(false)

	# Aplicar movimiento
	move_and_slide()

	# Rotar cámara
	_camera_pivot.rotation.y = _yaw
	_camera_pivot.rotation.x = _pitch
