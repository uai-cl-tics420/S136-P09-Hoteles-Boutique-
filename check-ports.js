async function main() {
  const { default: net } = await import("node:net");

  function checkPort(port) {
    const socket = new net.Socket();
    socket.setTimeout(2000);

    socket.on("connect", () => {
      console.log(`Port ${port} is open and accepting connections.`);
      socket.destroy();
    });

    socket.on("timeout", () => {
      console.log(`Port ${port} connection timed out.`);
      socket.destroy();
    });

    socket.on("error", (err) => {
      console.log(`Port ${port} error: ${err.message}`);
    });

    socket.connect(port, "127.0.0.1");
  }

  checkPort(5433);
  checkPort(6379);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
