let key = makeid(8);

document.querySelector("#key").innerText = key;

document.querySelector("#keyinputval").addEventListener("keyup", (e) => {
  let key = e.target.value;
  if (key === "") {
    document.getElementById("warn").classList.remove("d-none");
  } else {
    document.getElementById("warn").classList.add("d-none");
  }
});

chrome.storage.sync.set({ keyenc: encrypt(key) });

document.querySelector("#key-form").addEventListener("submit", (e) => {
  e.preventDefault();
  let key = document.querySelector("#keyinputval").value;
  let ch = window.confirm(
    `Are you sure you want to use "${key}" as your secret key?`
  );
  if (!ch) {
    return false;
  }
  chrome.storage.sync.set({ keyenc: encrypt(key) });
  alert("Your key has been saved successfully, you can leave the page now");
  window.close();
});

function makeid(length) {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function encrypt(string) {
  let encrypted = CryptoJS.AES.encrypt(
    "LockerExtensionCheckPassphrase",
    string
  );
  return encrypted.toString();
}
