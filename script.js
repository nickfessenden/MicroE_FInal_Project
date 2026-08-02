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
      if (data.tempUpperThreshold !== undefined) {
        document.getElementById("upper-temp-val").innerText =
          data.tempUpperThreshold;
      }
      if (data.tempLowerThreshold !== undefined) {
        document.getElementById("lower-temp-val").innerText =
          data.tempLowerThreshold;
      }
      if (data.temperature !== undefined) {
        document.getElementById("detail-temp-val").innerText = data.temperature;
      }
      if (data.tempLowerThreshold !== undefined) {
        document.getElementById("lower-temp-val").innerText =
          data.tempLowerThreshold;
      }
      if (data.humidityUpperThreshold !== undefined) {
        document.getElementById("upper-humidity-val").innerText =
          data.humidityUpperThreshold;
      }
      if (data.humidityLowerThreshold !== undefined) {
        document.getElementById("lower-humidity-val").innerText =
          data.humidityLowerThreshold;
      }

      if (data.lightUpperThreshold !== undefined) {
        document.getElementById("upper-sun-val").innerText =
          data.lightUpperThreshold + "LUX";
      }

      if (data.lightLowerThreshold !== undefined) {
        document.getElementById("lower-sun-val").innerText =
          data.lightLowerThreshold + "LUX";
      }
      if (data.moisture !== undefined) {
        document.getElementById("current-water-val").innerText =
          data.moisture + "%";
      }
      if (data.light !== undefined) {
        document.getElementById("detail-sun-val").innerText =
          data.light + "LUX";
      }
      if (data.humidity !== undefined) {
        document.getElementById("detail-humidity-val").innerText =
          data.humidity + "%";
      }

      if (data.upperWaterThreshold !== undefined) {
        document.getElementById("upper-water-val").innerText =
          data.upperWaterThreshold + "%";
      }

      if (data.lowerWaterThreshold !== undefined) {
        document.getElementById("lower-water-val").innerText =
          data.lowerWaterThreshold + "%";
      }
      if (data.soilHealth !== undefined) {
        document.getElementById("soil-health").innerText =
          "Your soil is " + data.soilHealth;
      }
      if (data.tempSafety !== undefined) {
        document.getElementById("temp-safety").innerText =
          "Your temperature is " + data.tempSafety;
      }
      if (data.lightSafety !== undefined) {
        document.getElementById("light-safety").innerText =
          "Your light level is " + data.lightSafety;
      }
      if (data.humiditySafety !== undefined) {
        document.getElementById("humidity-safety").innerText =
          "Your humidity is " + data.humiditySafety;
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

// Theme settings
document.querySelectorAll('input[name="theme"]').forEach((button) => {
  button.addEventListener("change", () => {
    document.body.classList.remove("dark", "light");

    if (button.value !== "default") {
      document.body.classList.add(button.value);
    }
  });
});

// Dashboard card size
document.getElementById("card-size").addEventListener("change", (event) => {
  document.querySelectorAll(".card").forEach((card) => {
    card.classList.remove("large", "compact");

    if (event.target.value !== "normal") {
      card.classList.add(event.target.value);
    }
  });
});

// Show/hide cards
document.getElementById("show-water").addEventListener("change", (e) => {
  document.querySelector(".water-card").style.display = e.target.checked
    ? "block"
    : "none";
});

document.getElementById("show-sun").addEventListener("change", (e) => {
  document.querySelector(".sun-card").style.display = e.target.checked
    ? "block"
    : "none";
});

document.getElementById("show-climate").addEventListener("change", (e) => {
  document.querySelector(".climate-card").style.display = e.target.checked
    ? "block"
    : "none";
});
