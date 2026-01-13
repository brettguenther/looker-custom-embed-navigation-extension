project_name: "looker-custom-embed-navigation"

application: looker-custom-embed-navigation {
  label: "Looker Custom Embed Navigation"
  url: "https://localhost:8080/bundle.js"
  entitlements: {
    core_api_methods: ["folder", "folder_children", "folder_dashboards", "folder_looks", "search_content", "move_dashboard", "move_look", "search_folders"]
    use_embeds: yes
    navigation: yes
    use_iframes: yes
    new_window: yes
    use_form_submit: yes
  }
  mount_points: {
    dashboard_vis: no
    dashboard_tile: no
    standalone: yes
  }
}
