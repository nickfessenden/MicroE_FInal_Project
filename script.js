const tabs = document.querySelectorAll("[data-tab-target]");
const tabContents = document.querySelectorAll("[data-tab-content]");
const navTabs = document.querySelectorAll(".tabs .tab");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = document.querySelector(tab.dataset.tabTarget);

    tabContents.forEach((content) => content.classList.remove("active"));
    navTabs.forEach((navTab) => navTab.classList.remove("active"));

    target.classList.add("active");

    if (tab.classList.contains("tab")) {
      tab.classList.add("active");
    }
  });
});

const brokerUrl =
  "wss://3c6221225b1a4998ae7bf76162aa5d29.s1.eu.hivemq.cloud:8884/mqtt";
const options = {
  username: "esp32_final_project",
  password: "xubwex-furby0-hedpAn",
  clientId: "web_" + Math.random().toString(16).substr(2, 4),
};

const client = mqtt.connect(brokerUrl, options);
const statusText = document.getElementById("connection-status");

client.on("connect", () => {
  statusText.innerText = "Connected! Waiting for telemetry...";
  client.subscribe("home/sensor");
});

client.on("message", (topic, message) => {
  if (topic === "home/sensor") {
    try {
      let data = JSON.parse(message.toString());

      if (data.water !== undefined) {
        document.getElementById("water-data").innerText = data.water + "%";
        document.getElementById("detail-water-val").innerText = data.water + "%";
      }
      if (data.sun !== undefined) {
        document.getElementById("sun-data").innerText = data.sun + "%";
        document.getElementById("detail-sun-val").innerText = data.sun + "%";
      }
      if (data.humidity !== undefined) {
        document.getElementById("humidity-data").innerText = data.humidity + "%";
        document.getElementById("detail-humidity-val").innerText = data.humidity + "%";
      }

      statusText.innerText = "Last Updated: " + new Date().toLocaleTimeString();
    } catch (e) {
      console.error("Failed to parse JSON payload:", e);
    }
  }
});

client.on("error", () => {
  statusText.innerText = "MQTT Connection Error!";
});

const topic = "mydevice/controls/dropdown";

document.addEventListener("DOMContentLoaded", () => {
  const dropdownButton = document.getElementById("dropdown-btn");
  const links = document.querySelectorAll(".dropdown-link");

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const selectedValue = link.getAttribute("data-value");
      const visibleText = link.textContent;

      dropdownButton.textContent = visibleText;

      if (client.connected) {
        client.publish(topic, selectedValue, { qos: 1 }, (err) => {
          if (err) {
            console.error("Publish error:", err);
          } else {
            console.log(`Published value: ${selectedValue}`);
          }
        });
      } else {
        console.error("Client not connected");
      }
    });
  });
});