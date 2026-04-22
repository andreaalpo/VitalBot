create table public.usuario(
    id bigint generated always as identity not null,
    nombre_completo varchar(100) not null,
    correo_electronico varchar(100) not null,
    password_hash varchar(255) not null,
    activo boolean not null default false::boolean,
    creado_en timestamp not null,
    actualizado_en timestamp not null,
    constraint usuario_pkey primary key (id),
    constraint usuario_correo_electronico_key unique (correo_electronico)
);

create table public.consentimiento_informado(
    id bigint generated always as identity not null,
    usuario_id bigint not null,
    version_terminos varchar(50) not null,
    ip_registro inet not null,
    aceptado boolean not null default false::boolean,
    fecha_aceptacion timestamp not null,
    constraint consentimiento_informado_pkey primary key (id),
    constraint consentimiento_informado_usuario_fkey foreign KEY (usuario_id) references usuario (id)
);

create table public.sesion(
    id bigint generated always as identity not null,
    usuario_id bigint not null,
    token_sesion varchar(255) not null,
    ip_cliente inet not null,
    activa boolean not null,
    inicio timestamp not null,
    ultima_actividad timestamp not null,
    expiracion timestamp not null,
    constraint sesion_pkey primary key (id),
    constraint sesion_usuario_fkey foreign KEY (usuario_id) references usuario (id)
);

create table public.token_recuperacion(
    id bigint generated always as identity not null,
    usuario_id bigint not null,
    token_hash varchar(255) not null,
    usado boolean not null default false::boolean,
    creado_en timestamp not null,
    expiracion timestamp not null,
    constraint token_recuperacion_pkey primary key (id),
    constraint token_recuperacion_usuario_fkey foreign KEY (usuario_id) references usuario (id)
);

create table public.log_autenticacion(
    id bigint generated always as identity not null,
    usuario_id bigint not null,
    tipo text not null,
    ip_cliente inet not null,
    exitoso boolean not null,
    fecha_hora timestamp not null,
    detalle text not null,
    constraint log_autenticacion_pkey primary key (id),
    constraint log_autenticacion_usuario_fkey foreign KEY (usuario_id) references usuario (id)
);

create table public.pseudonimo_usuario(
    id bigint generated always as identity not null,
    usuario_id bigint not null,
    pseudonimo varchar(100) not null,
    creado_en timestamp not null,
    constraint pseudonimo_usuario_pkey primary key (id),
    constraint pseudonimo_usuario_usuario_fkey foreign KEY (usuario_id) references usuario (id)
);

create table public.consulta(
    id bigint generated always as identity not null,
    pseudonimo_usuario bigint not null,
    nivel_riesgo varchar(10) not null,
    recomendacion text not null,
    alerta_critica boolean not null,
    fecha_hora timestamp not null,
    estado text not null,
    constraint consulta_pkey primary key (id),
    constraint consulta_pseudonimo_usuario_fkey foreign KEY (pseudonimo_usuario) references pseudonimo_usuario (id)
);

create table public.mensaje_chat(
    id bigint generated always as identity not null,
    consulta_id bigint not null,
    rol varchar(15) not null,
    contenido text not null,
    orden int not null,
    fecha_hora timestamp not null,
    constraint mensaje_chat_pkey primary key (id),
    constraint mensaje_chat_consulta_fkey foreign KEY (consulta_id) references consulta (id)
);

create table public.sintoma(
    id bigint generated always as identity not null,
    nombre varchar(100) not null,
    categoria text not null,
    descripcion text not null,
    es_critico boolean not null,
    activo boolean not null,
    constraint sintoma_pkey primary key (id),
    constraint sintoma_nombre_key unique (nombre)
);

create table public.sintoma_registrado(
    id bigint generated always as identity not null,
    consulta_id bigint not null,
    sintoma_id bigint not null,
    descripcion_libre text not null,
    frecuencia text not null,
    gravedad text not null,
    constraint sintoma_registrado_pkey primary key (id),
    constraint sintoma_registrado_consulta_fkey foreign KEY (consulta_id) references consulta (id),
    constraint sintoma_registrado_sintoma_fkey foreign KEY (sintoma_id) references sintoma (id)
);

create table public.contenido_educativo(
    id bigint generated always as identity not null,
    sintoma_id bigint not null,
    titulo text not null,
    cuerpo text not null,
    nivel_riesgo_asociado text not null,
    activo boolean not null,
    constraint contenido_educativo_pkey primary key (id),
    constraint contenido_educativo_sintoma_fkey foreign KEY (sintoma_id) references sintoma (id)
);

create table public.regla_medica(
    id bigint generated always as identity not null,
    nombre varchar(100) not null,
    condicion_json jsonb not null,
    nivel_riesgo_resultado text not null,
    recomendacion text not null,
    prioridad int not null,
    activa boolean not null,
    constraint regla_medica_pkey primary key (id),
    constraint nombre_key unique (nombre)
);

create table public.regla_sintoma(
    regla_id bigint not null,
    sintoma_id bigint not null,
    peso text not null,
    constraint regla_sintoma_sintoma_fkey foreign KEY (sintoma_id) references sintoma (id),
    constraint regla_sintoma_regla_medica_fkey foreign KEY (regla_id) references regla_medica (id),
    constraint regla_sintoma_pkey primary key (regla_id, sintoma_id)
);