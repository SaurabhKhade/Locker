let state = "keytaker";
// let state = "main-view";
let states = ["keytaker", "main-view"];
let keyenc = "";
let keyupwaitid = 0;

function closeAll(except) {
  for (let state of states) {
    document.getElementById(state).classList.add("d-none");
  }
  document.getElementById(except).classList.remove("d-none");
}

async function initiate() {
  if (state == "keytaker") {
    closeAll("keytaker");
  } else {
    closeAll("main-view");
    let links = "";
    try {
      links = await getFromStore("links");
      if (!links || links == "") {
        links = "[]";
      }
    } catch {
      links = "[]";
    }

    links = JSON.parse(decrypt(links) || "[]");

    renderLinks(links);
  }
}
initiate();

document.getElementById("key-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  let key = document.querySelector("#key-form input").value;

  if (await validateKey(key)) {
    keyenc = key;
    closeAll("main-view");
    let links = "";
    try {
      links = await getFromStore("links");
      if (!links || links == "") {
        links = "[]";
      }
    } catch {
      links = "[]";
    }
    links = JSON.parse(decrypt(links) || "[]");
    renderLinks(links);
  } else {
    document.getElementById("incorrect-message").classList.remove("d-none");
  }
});

document.getElementById("add_current").addEventListener("click", async (e) => {
  document.getElementById("exist-message").classList.add("d-none");
  let links = "";
  try {
    links = await getFromStore("links");
    if (!links || links == "") {
      links = "[]";
    }
  } catch {
    links = "[]";
  }
  links = JSON.parse(decrypt(links) || "[]");

  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);

  // for (let link of links) {
  //   if (link.url == tab.url) {
  //     let elm = document.getElementById("exist-message");
  //     elm.classList.remove("d-none");
  //     elm.innerText = `Link already exists with title: ${link.title}!`;
  //     return false;
  //   }
  // }

  links.push({
    url: tab.url,
    title: tab.title,
    id: Date.now(),
  });

  setByStore("links", encrypt(JSON.stringify(links)));
  renderLinks(links);
  closeAll("main-view");
});

function renderLinks(links) {
  let linkList = document.querySelector("#main-view .links-list");
  linkList.innerHTML = "";
  if (links.length === 0) {
    linkList.insertAdjacentHTML(
      "beforeend",
      `
      <p>No Links added</p>
      `
    );
  } else {
    for (let link of links) {
      linkList.insertAdjacentHTML(
        "beforeend",
        `
        <div class="link-item">
          <p class="link-item-href" title="${link.title}">${link.title}</p>
          <div class="d-flex gap-1">
            <button class="btn btn-info btn-sm shadow-none open-btn"  title="Open Link" value=${link.url}><i class="bi bi-link-45deg"></i></button>
            <button class="btn btn-warning btn-sm shadow-none rename-btn"  title="Rename Title" id=${link.id}><i class="bi bi-pencil"></i></button>
            <button class="btn btn-danger btn-sm shadow-none remove-btn" title="Delete Link" id=${link.id}><i class="bi bi-trash"></i></button>
          </div>
        </div>
      `
      );
    }
    document.querySelectorAll(".open-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        chrome.tabs.create({ url: btn.value, active: true });
      });
    });
    document.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => remove(btn.id));
    });
    document.querySelectorAll(".rename-btn").forEach((btn) => {
      btn.addEventListener("click", () => rename(btn.id));
    });
  }
}

async function remove(id) {
  console.log("remove");
  let links = "";
  try {
    links = await getFromStore("links");
    if (!links || links == "") {
      links = "[]";
    }
  } catch {
    links = "[]";
  }
  links = JSON.parse(decrypt(links) || "[]");
  let newLinks = [];
  for (let link of links) {
    if (link.id != id) {
      newLinks.push(link);
    }
  }

  setByStore("links", encrypt(JSON.stringify(newLinks)));
  renderLinks(newLinks);
}

async function rename(id) {
  let links = "";
  try {
    links = await getFromStore("links");
    if (!links || links == "") {
      links = "[]";
    }
  } catch {
    links = "[]";
  }
  links = JSON.parse(decrypt(links) || "[]");

  let to_rename = null;
  for (let link of links) {
    if (link.id == id) {
      to_rename = link;
      break;
    }
  }

  document.querySelector("#rename-title").value = to_rename.title;
  document.querySelector("#rename-id").value = to_rename.id;
  document.querySelector(".rename_box").classList.remove("d-none");
}

document
  .getElementById("rename-title-key")
  .addEventListener("click", async () => {
    let title = document.querySelector("#rename-title").value;
    let id = document.querySelector("#rename-id").value;

    let links = "";
    try {
      links = await getFromStore("links");
      if (!links || links == "") {
        links = "[]";
      }
    } catch {
      links = "[]";
    }
    links = JSON.parse(decrypt(links) || "[]");
    let newLinks = [];
    for (let link of links) {
      if (link.id == id) {
        newLinks.push({ ...link, title });
      } else {
        newLinks.push(link);
      }
    }

    setByStore("links", encrypt(JSON.stringify(newLinks)));

    document.querySelector(".rename_box").classList.add("d-none");
    renderLinks(newLinks);
  });

document.getElementById("filter-box").addEventListener("keyup", (e) => {
  let filter = e.target.value.toLowerCase();
  clearTimeout(keyupwaitid);
  keyupwaitid = setTimeout(async () => {
    let links = "";
    try {
      links = await getFromStore("links");
      if (!links || links == "") {
        links = "[]";
      }
    } catch {
      links = "[]";
    }
    links = JSON.parse(decrypt(links) || "[]");
    let filteredLinks = [];
    for (let link of links) {
      if (link.title.toLowerCase().includes(filter)) {
        filteredLinks.push(link);
      }
    }
    renderLinks(filteredLinks);
  }, 100);
});

document.getElementById("change_key").addEventListener("click", () => {
  document.querySelector(".change_key_box").classList.remove("d-none");
});

document
  .getElementById("key_change_btn")
  .addEventListener("click", async () => {
    let old_key = document.getElementById("key_old").value;
    let new_key = document.getElementById("key_new").value;
    let new_again = document.getElementById("key_new_repeat").value;

    if (new_key != new_again) {
      alert("Please enter the same key again");
      return;
    } else if (!(await validateKey(old_key))) {
      alert("Invalid old key");
      return;
    } else {
      let links = "";
      try {
        links = await getFromStore("links");
        if (!links || links == "") {
          links = "[]";
        }
      } catch {
        links = "[]";
      }
      links = decrypt(links) || "[]";

      chrome.storage.sync.set({
        keyenc: CryptoJS.AES.encrypt(
          "LockerExtensionCheckPassphrase",
          new_key
        ).toString(),
      });
      keyenc = new_key;

      links_encrypted = encrypt(links);
      setByStore("links", links_encrypted);
    }

    document.querySelector(".change_key_box").classList.add("d-none");
    alert("Key changed successfully");

    document.getElementById("key_old").value = "";
    document.getElementById("key_new").value = "";
    document.getElementById("key_new_repeat").value = "";
  });

document.getElementById("key_cancel_btn").addEventListener("click", () => {
  document.querySelector(".change_key_box").classList.add("d-none");
});

function encrypt(string) {
  let encrypted = CryptoJS.AES.encrypt(string, keyenc);
  return encrypted.toString();
}

function decrypt(string) {
  let decrypted = CryptoJS.AES.decrypt(string, keyenc);
  return decrypted.toString(CryptoJS.enc.Utf8);
}

async function getFromStore(key) {
  let prms = new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get(key, (result) => {
        resolve(result[key]);
      });
    } catch (e) {
      reject(e);
    }
  });
  return await prms;
}

async function setByStore(key, value) {
  chrome.storage.sync.set({ [key]: value });
}

async function validateKey(key) {
  // console.log(key)
  let keyenc = "";
  try {
    keyenc = await getFromStore("keyenc");
    if (!keyenc || keyenc == "") {
      keyenc = "";
    }
  } catch {
    keyenc = "";
  }
  // console.log(key);

  // keyenc = key;

  let decrypted = CryptoJS.AES.decrypt(keyenc, key);

  return (
    decrypted.toString(CryptoJS.enc.Utf8) == "LockerExtensionCheckPassphrase"
  );
}
