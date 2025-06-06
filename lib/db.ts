import { Pool } from "pg"

const pool = new Pool({
  host: "ec2-54-169-182-174.ap-southeast-1.compute.amazonaws.com",
  user: "dev_applicant",
  password: "bfEJGCBRYfW1NOiWeGEA",
  port: 5432,
  database: "FSD_Velez",
  ssl: {
    rejectUnauthorized: false,
  },
})

export default pool
