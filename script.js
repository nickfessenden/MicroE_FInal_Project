const tabs = document.querySelectorAll("[data-tab-target]");
const tabContents = document.querySelectorAll("[data-tab-content]");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = document.querySelector(tab.dataset.tabTarget);
    tabContents.forEach((tabContent) => {
      tabContent.classList.remove("active");
    });
    tabs.forEach((tab) => {
      tab.classList.remove("active");
    });
    target.classList.add("active");
    tab.classList.add("active");
  });
});

// ==================== CONFIGURATION ====================
const brokerUrl =
  "wss://3c6221225b1a4998ae7bf76162aa5d29.s1.eu.hivemq.cloud:8884/mqtt";
const options = {
  username: "esp32_final_project",
  password: "xubwex-furby0-hedpAn",
  clientId: "web_" + Math.random().toString(16).substr(2, 4),
};
// =======================================================

const client = mqtt.connect(brokerUrl, options);
const statusText = document.getElementById("connection-status");
const dataText = document.getElementById("sensor-data");

client.on("connect", () => {
  statusText.innerText = "Connected! Waiting...";
  client.subscribe("home/sensor");
});

client.on("message", (topic, message) => {
  if (topic === "home/sensor") {
    let data = JSON.parse(message.toString());

    dataText.innerText = data.value;
    //Placeholder: document.getElementById("water-data") = data.water_value
    statusText.innerText = "Updated: " + new Date().toLocaleTimeString();
  }
});

client.on("error", () => {
  statusText.innerText = "Error!";
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
