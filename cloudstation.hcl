project = "fullstack-admin-boilerplate"

variable "database_url" {
  env         = ["DATABASE_URL"]
  sensitive   = true
  description = "PostgreSQL connection string"
}

variable "better_auth_secret" {
  env         = ["BETTER_AUTH_SECRET"]
  sensitive   = true
  description = "Better Auth session signing secret (32+ chars)"
}

variable "better_auth_url" {
  env         = ["BETTER_AUTH_URL"]
  description = "Backend URL for Better Auth callbacks"
}

app "fullstack-admin-boilerplate" {
  build {
    use = "nixpacks"

    nixPkgs = ["nodejs_22", "npm-10_x"]
  }

  deploy {
    use  = "nomad-pack"
    pack = "cloudstation"
  }

  config {
    internal_port = 3100

    env = {
      NODE_ENV = "production"
    }
  }
}
