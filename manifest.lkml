project_name: "looker-custom-embed-navigation"

application: looker-custom-embed-navigation {
  label: "Looker Custom Embed Navigation"
  url: "https://localhost:8080/bundle.js"
  entitlements: {
    core_api_methods: ["create_board_item", "all_boards", "board", "create_board", "create_board_section", "search_dashboards", "all_dashboards", "me", "search_content", "folder", "folder_dashboards", "folder_looks", "search_looks", "look", "dashboard", "folder_children"]
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
