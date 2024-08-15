import cac from "cac";
import { startServer } from "../server";

const cli = cac();

cli.command("[root]", "Run the development server")
    .alias("server")
    .alias("dev")
    .action(async () => {
        await startServer();
    });

cli.help();
cli.parse();
