update auth.users
set
  raw_app_meta_data  = coalesce(raw_app_meta_data, '{}'::jsonb)  || jsonb_build_object('role','admin'),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('username','admin','full_name','BookedLoop Admin')
where id = 'REPLACE_WITH_AUTH_USER_ID';
