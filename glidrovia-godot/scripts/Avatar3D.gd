extends Node3D

# ── Glidrovia Avatar 3D — Personaje bloque estilo Roblox ─────────────────────
# Construye el avatar con primitivos BoxMesh. Totalmente configurable por color.

var body_colors: Dictionary = {}

# Referencias a las partes del cuerpo
var _head: MeshInstance3D
var _torso: MeshInstance3D
var _left_arm: MeshInstance3D
var _right_arm: MeshInstance3D
var _left_leg: MeshInstance3D
var _right_leg: MeshInstance3D

# Animación simple
var _time: float = 0.0
var is_walking: bool = false
var is_jumping: bool = false

func _ready() -> void:
	if body_colors.is_empty():
		body_colors = GameManager.get_avatar_body_colors()
	_build_avatar()

func _process(delta: float) -> void:
	_time += delta
	_animate(delta)

# ── Construcción del avatar ───────────────────────────────────────────────────

func _build_avatar() -> void:
	# Limpiar partes anteriores
	for child in get_children():
		child.queue_free()

	# Cabeza
	_head = _create_box(Vector3(0.75, 0.75, 0.75), body_colors.get("head", Color("#F5CD30")))
	_head.position = Vector3(0, 1.85, 0)
	_head.name = "Head"
	add_child(_head)

	# Ojos (dos cajas negras pequeñas en la cara)
	var left_eye = _create_box(Vector3(0.15, 0.12, 0.05), Color(0.1, 0.1, 0.1))
	left_eye.position = Vector3(-0.18, 0.08, 0.38)
	_head.add_child(left_eye)

	var right_eye = _create_box(Vector3(0.15, 0.12, 0.05), Color(0.1, 0.1, 0.1))
	right_eye.position = Vector3(0.18, 0.08, 0.38)
	_head.add_child(right_eye)

	# Boca (caja negra pequeña)
	var mouth = _create_box(Vector3(0.25, 0.06, 0.05), Color(0.1, 0.1, 0.1))
	mouth.position = Vector3(0, -0.15, 0.38)
	_head.add_child(mouth)

	# Torso
	_torso = _create_box(Vector3(1.0, 1.1, 0.5), body_colors.get("torso", Color("#0047AB")))
	_torso.position = Vector3(0, 1.0, 0)
	_torso.name = "Torso"
	add_child(_torso)

	# Brazo izquierdo
	_left_arm = _create_box(Vector3(0.45, 1.0, 0.45), body_colors.get("left_arm", Color("#F5CD30")))
	_left_arm.position = Vector3(-0.73, 1.0, 0)
	_left_arm.name = "LeftArm"
	add_child(_left_arm)

	# Brazo derecho
	_right_arm = _create_box(Vector3(0.45, 1.0, 0.45), body_colors.get("right_arm", Color("#F5CD30")))
	_right_arm.position = Vector3(0.73, 1.0, 0)
	_right_arm.name = "RightArm"
	add_child(_right_arm)

	# Pierna izquierda
	_left_leg = _create_box(Vector3(0.45, 0.8, 0.45), body_colors.get("left_leg", Color("#A2C429")))
	_left_leg.position = Vector3(-0.25, 0.38, 0)
	_left_leg.name = "LeftLeg"
	add_child(_left_leg)

	# Pierna derecha
	_right_leg = _create_box(Vector3(0.45, 0.8, 0.45), body_colors.get("right_leg", Color("#A2C429")))
	_right_leg.position = Vector3(0.25, 0.38, 0)
	_right_leg.name = "RightLeg"
	add_child(_right_leg)

func _create_box(size: Vector3, color: Color) -> MeshInstance3D:
	var mi = MeshInstance3D.new()
	var mesh = BoxMesh.new()
	mesh.size = size
	mi.mesh = mesh
	var mat = StandardMaterial3D.new()
	mat.albedo_color = color
	mat.roughness = 0.8
	mi.set_surface_override_material(0, mat)
	return mi

# ── Colores ───────────────────────────────────────────────────────────────────

func set_body_colors(colors: Dictionary) -> void:
	body_colors = colors
	_apply_colors()

func _apply_colors() -> void:
	if _head:
		_get_mat(_head).albedo_color = body_colors.get("head", Color("#F5CD30"))
	if _torso:
		_get_mat(_torso).albedo_color = body_colors.get("torso", Color("#0047AB"))
	if _left_arm:
		_get_mat(_left_arm).albedo_color = body_colors.get("left_arm", Color("#F5CD30"))
	if _right_arm:
		_get_mat(_right_arm).albedo_color = body_colors.get("right_arm", Color("#F5CD30"))
	if _left_leg:
		_get_mat(_left_leg).albedo_color = body_colors.get("left_leg", Color("#A2C429"))
	if _right_leg:
		_get_mat(_right_leg).albedo_color = body_colors.get("right_leg", Color("#A2C429"))

func _get_mat(mi: MeshInstance3D) -> StandardMaterial3D:
	return mi.get_surface_override_material(0) as StandardMaterial3D

# ── Animaciones ───────────────────────────────────────────────────────────────

func _animate(_delta: float) -> void:
	if not _left_arm or not _right_arm:
		return

	if is_walking:
		# Brazos y piernas oscilan al caminar
		var swing = sin(_time * 8.0) * 0.4
		_left_arm.rotation.x  =  swing
		_right_arm.rotation.x = -swing
		_left_leg.rotation.x  = -swing
		_right_leg.rotation.x =  swing
		# Bob leve de cabeza
		_head.position.y = 1.85 + sin(_time * 8.0) * 0.03
	elif is_jumping:
		_left_arm.rotation.x  = -0.8
		_right_arm.rotation.x = -0.8
	else:
		# Idle: pequeño bob de respiración
		var idle_bob = sin(_time * 1.5) * 0.02
		_head.position.y = 1.85 + idle_bob
		_torso.position.y = 1.0 + idle_bob * 0.5
		_left_arm.rotation.x  = lerp(_left_arm.rotation.x,  0.0, 0.1)
		_right_arm.rotation.x = lerp(_right_arm.rotation.x, 0.0, 0.1)
		_left_leg.rotation.x  = lerp(_left_leg.rotation.x,  0.0, 0.1)
		_right_leg.rotation.x = lerp(_right_leg.rotation.x, 0.0, 0.1)

func set_walking(walking: bool) -> void:
	is_walking = walking

func set_jumping(jumping: bool) -> void:
	is_jumping = jumping
