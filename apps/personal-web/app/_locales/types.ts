export type Locale = "en" | "zh";

export type LocaleDict = {
  brand: string;
  // Login
  login_title: string;
  login_subtitle: string;
  email_label: string;
  password_label: string;
  email_placeholder: string;
  password_placeholder: string;
  sign_in: string;
  no_account: string;
  create_one: string;
  // Register
  register_title: string;
  register_subtitle: string;
  confirm_label: string;
  confirm_placeholder: string;
  create_account: string;
  has_account: string;
  // Dashboard common
  account_platform: string;
  search_placeholder: string;
  notifications: string;
  mark_all_read: string;
  view_all: string;
  sign_out: string;
  // Sidebar
  nav_dashboard: string;
  nav_profile: string;
  nav_security: string;
  nav_activity: string;
  nav_api_keys: string;
  nav_settings: string;
  // Dashboard home
  dashboard_heading: string;
  dashboard_desc: string;
  stat_sessions: string;
  stat_logged_in_as: string;
  stat_account_age: string;
  stat_last_login: string;
  recent_activity: string;
  view_all_link: string;
  quick_actions: string;
  action_new_api_key: string;
  action_invite_user: string;
  action_export_data: string;
  action_view_logs: string;
  systems_operational: string;
  static_preview: string;
};
