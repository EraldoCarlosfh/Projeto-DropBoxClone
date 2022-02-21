class DropBoxController {
  constructor() {

    this.currentFolder = ['Dropbox'];

    this.onselectionchange = new Event('selectionchange');

    this.navEl = document.querySelector('#browse-location');
    this.btnSendFileEl = document.querySelector('#btn-send-file');
    this.inputFilesEl = document.querySelector('#files');
    this.snackModalEl = document.querySelector('#react-snackbar-root');
    this.progressBarEl = this.snackModalEl.querySelector('.mc-progress-bar-fg');
    this.nameFileEl = this.snackModalEl.querySelector('.filename');
    this.timeleftEl = this.snackModalEl.querySelector('.timeleft');
    this.listFilesEl = document.querySelector('#list-of-files-and-directories');

    this.btnNewFolder = document.querySelector('#btn-new-folder');
    this.btnRename = document.querySelector('#btn-rename');
    this.btnDelete = document.querySelector('#btn-delete');

    this.connectFirebase();
    this.initEvents();
    this.openFolder();
  }

  connectFirebase() {
    const firebaseConfig = {
      apiKey: 'AIzaSyB5qrLhffQx7wH_tmWie6RNacX2RL3bAj0',
      authDomain: 'dropboxclone-e895f.firebaseapp.com',
      databaseURL: 'https://dropboxclone-e895f-default-rtdb.firebaseio.com',
      projectId: 'dropboxclone-e895f',
      storageBucket: 'dropboxclone-e895f.appspot.com',
      messagingSenderId: '955428696045',
      appId: '1:955428696045:web:20b000efff8737958041e4',
      measurementId: 'G-S9PXXEV480'
    };

    firebase.initializeApp(firebaseConfig);
  }

  getSelection() {
    return this.listFilesEl.querySelectorAll('.selected');
  }

  removeTask() {
    let promises = [];

    this.getSelection().forEach((li) => {
      let file = JSON.parse(li.dataset.file);
      let key = li.dataset.key;

      console.log(key);

      let formData = new FormData();

      formData.append('filepath', file.filepath);
      formData.append('key', key);

      promises.push(this.ajax('/file', 'DELETE', formData));

    });

    return Promise.all(promises);
  }

  openFolder() {

    if (this.lastFolder) this.getFirebaseRef(this.lastFolder).off('value');

    this.renderNav();
    this.readFiles();
  }

  renderNav() {

    let nav = document.createElement('nav');
    let path = [];

    for (let i = 0; i < this.currentFolder.length; i++) {

      let folderName = this.currentFolder[i];
      let span = document.createElement('span');

      path.push(folderName);

      if ((i + 1) === this.currentFolder.length) {

        span.innerHTML = folderName;

      } else {

        span.className = 'breadcrumb-segment__wrapper';
        span.innerHTML = `          
            <span class="ue-effect-container uee-BreadCrumbSegment-link-0">
              <a href="#" data-path="${path.join('/')}" class="breadcrumb-segment">${folderName}</a>
            </span>
            <svg width="24" height="24" viewBox="0 0 24 24" class="mc-icon-template-stateless" style="top: 4px; position: relative;">
              <title>arrow-right</title>
              <path d="M10.414 7.05l4.95 4.95-4.95 4.95L9 15.534 12.536 12 9 8.464z" fill="#637282" fill-rule="evenodd"></path>
            </svg>      
        `;
      }
      nav.appendChild(span);
    }

    this.navEl.innerHTML = nav.innerHTML;

    this.navEl.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', event => {
        event.preventDefault();

        this.currentFolder = a.dataset.path.split('/');

        this.openFolder()
      });
    });

  }


  initEvents() {


    this.btnNewFolder.addEventListener('click', event => {

      let originalFilename = prompt('Nome da nova pasta:');

      if (originalFilename) {
        this.getFirebaseRef().push().set({

          originalFilename,
          mimetype: 'folder',
          filepath: this.currentFolder.join('/')
        });
      }

    });


    this.btnDelete.addEventListener("click", event => {
      this.removeTask()
        .then((responses) => {

          responses.forEach(response => {
            if (response.fields.key) {
              this.getFirebaseRef().child
              (response.fields.key).remove();
            }
          })

          console.log("responses");
        })
        .catch((err) => {
          console.log(err);
        });
    });

    this.btnRename.addEventListener('click', event => {
      let li = this.getSelection()[0];
      let file = JSON.parse(li.dataset.file);

      let name = prompt('Renomar o arquivo:', file.originalFilename);

      if (name) {
        file.originalFilename = name;

        this.getFirebaseRef().child(li.dataset.key).set(file);
      }
    });

    this.listFilesEl.addEventListener('selectionchange', event => {
      switch (this.getSelection().length) {
        case 0:
          this.btnDelete.style.display = 'none';
          this.btnRename.style.display = 'none';
          break;

        case 1:
          this.btnDelete.style.display = 'block';
          this.btnRename.style.display = 'block';
          break;

        default:
          this.btnDelete.style.display = 'block';
          this.btnRename.style.display = 'none';
      }
    });

    this.btnSendFileEl.addEventListener('click', event => {
      this.inputFilesEl.click();
    });

    this.inputFilesEl.addEventListener('change', event => {
      this.btnSendFileEl.disabled = true;
      this.uploadTask(event.target.files)
        .then((responses) => {
          responses.forEach((resp) => {
            this.getFirebaseRef().push().set(resp.files['input-file']);
          });

          this.uploadComplete();
        })
        .catch((err) => {
          this.uploadComplete();
          console.error(err);
        });

      this.modalShow();
    });
  }

  uploadComplete() {
    this.modalShow(false);
    this.inputFilesEl.value = '';
    this.btnSendFileEl.disabled = false;
  }

  getFirebaseRef(filepath) {

    if (!filepath) filepath = this.currentFolder.join('/');

    return firebase.database().ref(filepath);
  }

  modalShow(show = true) {
    this.snackModalEl.style.display = show ? 'block' : 'none';
  }

  ajax(
    url,
    method = 'GET',
    formData = new FormData(),
    onprogress = function () {},
    onloadstart = function () {}
  ) {
    return new Promise((resolve, reject) => {
      let ajax = new XMLHttpRequest();

      ajax.open(method, url);

      ajax.onload = (event) => {
        try {
          resolve(JSON.parse(ajax.responseText));
        } catch (err) {
          reject(err);
        }
      };

      ajax.onerror = (event) => {
        reject(event);
      };

      ajax.upload.onprogress = onprogress;

      onloadstart();

      ajax.send(formData);
    });
  }

  uploadTask(files) {
    let promises = [];

    [...files].forEach((file) => {
      let formData = new FormData();

      formData.append('input-file', file);

      promises.push(
        this.ajax(
          '/upload',
          'POST',
          formData,
          () => {
            this.uploadProgress(event, file);
          },
          () => {
            this.startUploadTime = Date.now();
          }
        )
      );
    });

    return Promise.all(promises);
  }

  uploadProgress(event, file) {
    let timespent = Date.now() - this.startUploadTime;
    let loaded = event.loaded;
    let total = event.total;
    let porcent = parseInt((loaded / total) * 100);
    let timeleft = ((100 - porcent) * timespent) / porcent;

    this.progressBarEl.style.width = `${porcent}%`;

    this.nameFileEl.innerHTML = file.originalFilename;
    this.timeleftEl.innerHTML = this.formatTimeToHuman(timeleft);
  }

  formatTimeToHuman(duration) {
    let seconds = parseInt((duration / 1000) % 60);
    let minutes = parseInt((duration / (1000 * 60)) % 60);
    let hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    if (hours > 0) {
      return `${hours} horas, ${minutes} minutos e ${seconds} segundos`;
    }

    if (minutes > 0) {
      return `${minutes} minutos e ${seconds} segundos`;
    }

    if (seconds > 0) {
      return `${seconds} segundos`;
    }

    return '';
  }

  getFileIconView(file) {

    switch (file.mimetype) {
      case 'folder':
        return `
                <div style="display: flex; flex-direction: column; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
                width="96" height="96"
                viewBox="0 0 172 172"
                style=" fill:#000000;"><defs><linearGradient x1="82.41667" y1="143.33333" x2="82.41667" y2="28.66667" gradientUnits="userSpaceOnUse" id="color-1_C8gfz6xPL7TZ_gr1"><stop offset="0.295" stop-color="#2c00cf"></stop><stop offset="0.425" stop-color="#0a76d3"></stop><stop offset="0.656" stop-color="#24a4df"></stop><stop offset="0.96" stop-color="#4fe9f2"></stop><stop offset="1" stop-color="#55f5f0"></stop></linearGradient><linearGradient x1="89.63413" y1="151.84017" x2="89.5987" y2="49.67217" gradientUnits="userSpaceOnUse" id="color-2_C8gfz6xPL7TZ_gr2"><stop offset="0" stop-color="#3000e3"></stop><stop offset="1" stop-color="#82fff4"></stop></linearGradient></defs><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M0,172v-172h172v172z" fill="none"></path><g><g><path d="M25.08333,143.33333c-3.95804,0 -7.16667,-3.20863 -7.16667,-7.16667v-93.49633c-0.00401,-2.12077 0.61936,-4.19536 1.79167,-5.96267l3.225,-4.84825c1.33299,-2.00055 3.58021,-3.19951 5.98417,-3.19275h28.20083c2.40756,0.00281 4.65284,1.21429 5.977,3.225l2.86667,4.32867c1.32416,2.01071 3.56944,3.22219 5.977,3.225h67.811c3.95804,0 7.16667,3.20863 7.16667,7.16667v14.03592z" fill="url(#color-1_C8gfz6xPL7TZ_gr1)"></path><path d="M138.70367,143.33333h-114.66667c-1.81852,0.06352 -3.56309,-0.72256 -4.72024,-2.12686c-1.15714,-1.4043 -1.59515,-3.26699 -1.1851,-5.03981l12.00775,-68.08333c0.80819,-4.05385 4.29695,-7.02049 8.428,-7.16667h32.02425c2.54628,-0.07225 4.93493,-1.24957 6.54317,-3.225l3.63708,-4.3c1.60824,-1.97543 3.99688,-3.15275 6.54317,-3.225h67.81458c1.81852,-0.06352 3.56309,0.72256 4.72024,2.12686c1.15714,1.4043 1.59515,3.26699 1.1851,5.03981l-13.90333,78.83333c-0.80819,4.05385 -4.29695,7.02049 -8.428,7.16667z" fill="url(#color-2_C8gfz6xPL7TZ_gr2)"></path></g></g></g></svg></div>
                `;
        break;

      case 'application/pdf':
        return `
                <div style="display: flex; flex-direction: column; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
                width="96" height="96"
                viewBox="0 0 226 226"
                style=" fill:#000000;"><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M0,226v-226h226v226z" fill="none"></path><g><path d="M188.33333,211.875h-150.66667v-197.75h103.58333l47.08333,47.08333z" fill="#ef4210"></path><path d="M181.27083,65.91667h-44.72917v-44.72917z" fill="#fbe9e7"></path><path d="M75.33333,183.625c-1.88333,0 -3.29583,-0.47083 -4.70833,-0.94167c-5.17917,-2.825 -5.65,-7.0625 -4.70833,-10.35833c1.88333,-5.65 12.24167,-12.7125 25.89583,-18.83333v0c6.12083,-11.3 10.82917,-23.07083 13.65417,-32.95833c-4.70833,-8.94583 -7.0625,-17.42083 -7.0625,-23.54167c0,-3.29583 0.94167,-6.12083 2.35417,-8.475c1.88333,-2.35417 4.70833,-3.76667 8.475,-3.76667c4.2375,0 7.53333,2.35417 8.94583,6.59167c2.35417,5.65 0.94167,16.00833 -2.35417,27.77917c4.70833,8.00417 10.35833,15.5375 16.47917,21.1875c8.94583,-1.88333 16.95,-2.825 22.12917,-1.88333c8.94583,1.4125 10.35833,7.53333 10.35833,9.8875c0,9.8875 -10.35833,9.8875 -14.125,9.8875c-7.0625,0 -14.125,-2.825 -20.24583,-8.00417v0c-11.3,2.825 -22.6,6.59167 -31.54583,10.82917c-4.70833,8.00417 -9.41667,14.59583 -13.65417,18.3625c-4.2375,3.29583 -7.53333,4.2375 -9.8875,4.2375zM80.98333,169.97083c-2.35417,1.4125 -4.2375,2.825 -5.17917,4.2375c0.94167,-0.47083 2.825,-1.4125 5.17917,-4.2375zM145.01667,147.84167c1.88333,0.47083 3.76667,0.94167 5.65,0.94167c2.825,0 4.2375,-0.47083 4.70833,-0.47083v0c-0.47083,-0.47083 -3.76667,-1.4125 -10.35833,-0.47083zM112.05833,130.89167c-1.88333,5.65 -4.70833,11.77083 -7.0625,17.42083c5.65,-1.88333 11.3,-3.76667 16.95,-5.17917c-3.76667,-3.76667 -7.0625,-8.00417 -9.8875,-12.24167zM109.23333,94.16667c-0.47083,0 -0.47083,0 -0.47083,0c-0.47083,0.47083 -0.94167,3.76667 0.94167,10.82917c0.47083,-5.65 0.47083,-9.8875 -0.47083,-10.82917z" fill="#ffffff"></path></g></g></svg></div>
                `;

      case 'video/mp4':
      case 'video/wmv':
      case 'video/mpeg':
      case 'video/mpg':
      case 'video/avi':
        return `
                <div style="display: flex; flex-direction: column; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="96" height="96" viewBox="0 0 226 226" style=" fill:#000000;"><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M0,226v-226h226v226z" fill="none"></path><g fill="#007bff"><path d="M113.1638,16.10874c-19.77897,0 -40.59437,8.11092 -57.10693,22.26946c-17.78534,15.15469 -29.24485,36.42495 -32.11748,59.61398h-16.87689c-0.97448,0.00513 -1.86826,0.54238 -2.32996,1.40056c-0.46171,0.85818 -0.41753,1.90006 0.11517,2.71607l18.73132,28.56209c0.48919,0.747 1.32186,1.19721 2.21479,1.19749c0.89213,0 1.7243,-0.44914 2.21393,-1.1949l18.73132,-28.56467c0.5327,-0.81601 0.57688,-1.85789 0.11517,-2.71607c-0.46171,-0.85818 -1.35548,-1.39543 -2.32996,-1.40056h-15.24662c2.88968,-21.61995 13.65252,-41.41434 30.22771,-55.59305c15.56663,-13.34812 35.12468,-20.99783 53.65845,-20.99783c12.08879,0 24.72749,3.26005 36.54879,9.42385c12.27387,6.41002 22.9194,15.54188 31.12259,26.69732c0.55337,0.77827 1.48286,1.19838 2.43267,1.0995c0.94981,-0.09887 1.77285,-0.70141 2.15405,-1.57697c0.3812,-0.87556 0.26154,-1.88853 -0.31318,-2.65117c-8.68394,-11.80992 -19.95382,-21.47736 -32.9477,-28.26293c-12.57434,-6.55665 -26.05915,-10.02216 -38.99721,-10.02216zM66.65234,86.51563c-1.61986,-0.03853 -3.1872,0.5758 -4.34944,1.7048c-1.16224,1.129 -1.82178,2.67786 -1.83025,4.29815v40.96284c0.00847,1.6203 0.66801,3.16915 1.83025,4.29815c1.16224,1.129 2.72958,1.74333 4.34944,1.7048h62.47278c3.40766,0 6.3866,-2.59309 6.3866,-6.00295v-40.96284c0,-3.40766 -2.97894,-6.00037 -6.3866,-6.00037zM165.52734,92.26597l-24.71875,13.68101v14.11035l24.71875,13.67756zM200.18118,94.12988c-0.88358,0.00875 -1.70459,0.45757 -2.18892,1.19663l-18.73132,28.55864c-0.53408,0.81656 -0.57909,1.85975 -0.11733,2.71928c0.46176,0.85953 1.35642,1.3979 2.33212,1.40338h15.24662c-2.88968,21.61995 -13.65252,41.41434 -30.22771,55.59305c-15.56663,13.34813 -35.12468,20.99784 -53.65845,20.99783c-12.08879,0 -24.72748,-3.26005 -36.54879,-9.42385c-12.27387,-6.41002 -22.9194,-15.54188 -31.12259,-26.69732c-0.55336,-0.77828 -1.48286,-1.1984 -2.43267,-1.09952c-0.94982,0.09887 -1.77286,0.70142 -2.15406,1.57698c-0.3812,0.87556 -0.26153,1.88855 0.3132,2.65118c8.68393,11.80992 19.95382,21.47736 32.9477,28.26293c12.57434,6.55665 26.05915,10.01958 38.99721,10.01958c19.77897,0 40.59437,-8.11005 57.10693,-22.2686c17.78497,-15.15427 29.24444,-36.42385 32.11747,-59.61226h16.87689c0.97541,-0.00568 1.86975,-0.54393 2.33145,-1.40317c0.4617,-0.85924 0.41695,-1.9021 -0.11666,-2.71863l-18.73132,-28.5595c-0.49423,-0.75414 -1.33818,-1.20502 -2.23979,-1.19663z"></path></g></g></svg></div>
                    `;


      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'text/plain':

        return `
                <div style="display: flex; flex-direction: column; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
width="96" height="96"
viewBox="0 0 48 48"
style=" fill:#000000;"><path fill="#e64a19" d="M7 12L29 4 41 7 41 41 29 44 7 36 29 39 29 10 15 13 15 33 7 36z"></path></svg></div>
                `;

      case 'audio/mp3':
      case 'audio/ogg':
      case 'audio/wav':
      case 'audio/mpeg':
        return `
                <div style="display: flex; flex-direction: column; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
                width="96" height="96"
                viewBox="0 0 172 172"
                style=" fill:#000000;"><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M0,172v-172h172v172z" fill="none"></path><g fill="#007bff"><path d="M86,6.88c-43.6192,0 -79.12,35.5008 -79.12,79.12c0,43.6192 35.5008,79.12 79.12,79.12c43.6192,0 79.12,-35.5008 79.12,-79.12c0,-43.6192 -35.5008,-79.12 -79.12,-79.12zM137.6,103.2h-15.48c-6.6392,0 -12.04,-5.4008 -12.04,-12.04v-10.32c0,-2.8552 -2.3048,-5.16 -5.16,-5.16c-2.8552,0 -5.16,2.3048 -5.16,5.16v27.52c0,6.6392 -5.4008,12.04 -12.04,12.04c-6.6392,0 -12.04,-5.4008 -12.04,-12.04v-44.72c0,-2.8552 -2.3048,-5.16 -5.16,-5.16c-2.8552,0 -5.16,2.3048 -5.16,5.16v27.52c0,6.6392 -5.4008,12.04 -12.04,12.04h-18.92v-6.88h18.92c2.8552,0 5.16,-2.3048 5.16,-5.16v-27.52c0,-6.6392 5.4008,-12.04 12.04,-12.04c6.6392,0 12.04,5.4008 12.04,12.04v44.72c0,2.8552 2.3048,5.16 5.16,5.16c2.8552,0 5.16,-2.3048 5.16,-5.16v-27.52c0,-6.6392 5.4008,-12.04 12.04,-12.04c6.6392,0 12.04,5.4008 12.04,12.04v10.32c0,2.8552 2.3048,5.16 5.16,5.16h15.48z"></path></g></g></svg></div>
                `;

      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
      case 'image/gif':
        return `
                <div style="display: flex; flex-direction: column; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
                width="96" height="96"
                viewBox="0 0 172 172"
                style=" fill:#000000;"><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M0,172v-172h172v172z" fill="none"></path><g fill="#95a5a6"><path d="M18.8125,17.46875c-9.675,0 -17.46875,7.79375 -17.46875,17.46875v104.8125c0,9.675 7.79375,17.46875 17.46875,17.46875h134.375c9.675,0 17.46875,-7.79375 17.46875,-17.46875v-104.8125c0,-9.675 -7.79375,-17.46875 -17.46875,-17.46875zM18.8125,25.53125h134.375c5.24062,0 9.40625,4.16563 9.40625,9.40625v46.22553c0,2.41875 -2.15052,4.3 -4.56927,4.03125c-58.31875,-8.86875 -98.63073,12.63125 -114.3526,61.14062c-0.5375,1.6125 -2.01615,2.82135 -3.8974,2.82135h-20.96197c-5.24062,0 -9.40625,-4.16563 -9.40625,-9.40625v-104.8125c0,-5.24062 4.16563,-9.40625 9.40625,-9.40625zM48.375,41.62213c-5.84531,0 -11.69062,2.25131 -16.125,6.75287c-8.86875,8.86875 -8.86875,23.38072 0,32.38385c4.43438,4.43438 10.34687,6.71875 16.125,6.71875c5.77812,0 11.69063,-2.28437 16.125,-6.71875c8.86875,-8.86875 8.86875,-23.38072 0,-32.38385c-4.43437,-4.50156 -10.27969,-6.75287 -16.125,-6.75287z"></path></g></g></svg></div>
                       `;
      default:
        return `
                <div style="display: flex; flex-direction: column; align-items: center;"><svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                        <title>1357054_617b.jpg</title>
                        <defs>
                        <rect id="mc-content-unknown-large-b" x="43" y="30" width="74" height="100" rx="4"></rect>
                            <filter x="-.7%" y="-.5%" width="101.4%" height="102%" filterUnits="objectBoundingBox" id="mc-content-unknown-large-a">
                                <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1">
                                </feOffset>
                                <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix>
                            </filter>
                        </defs>
                        <g fill="none" fill-rule="evenodd">
                            <g>
                                <use fill="#000" filter="url(#mc-content-unknown-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-large-b"></use>
                                <use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-large-b"></use>
                            </g>
                        </g>
                    </svg></div>
                   `;
    }

  }


  getFileView(file, key) {
    let li = document.createElement('li');

    li.dataset.key = key;
    li.dataset.file = JSON.stringify(file);

    li.innerHTML = `
      ${this.getFileIconView(file)}
      <div class="name text-center">${file.originalFilename}</div>
    `;
    this.initEventsLi(li);

    return li;
  }

  readFiles() {

    this.lastFolder = this.currentFolder.join('/');

    this.getFirebaseRef().on('value', (snapshot) => {
      this.listFilesEl.innerHTML = '';
      snapshot.forEach((snapshotItem) => {
        let key = snapshotItem.key;
        let data = snapshotItem.val();

        if (data.mimetype) {
          this.listFilesEl.appendChild(this.getFileView(data, key));
        }
      });
    });
  }

  initEventsLi(li) {

    li.addEventListener('dblclick', event => {

      let file = JSON.parse(li.dataset.file);

      switch (file.mimetype) {

        case 'folder':
          this.currentFolder.push(file.originalFilename);
          this.openFolder();
          break;

        default:
          window.open(`/file?path=${file.filepath}`);
      }

    });

    li.addEventListener('click', event => {
      if (event.shiftKey) {
        let firstLi = this.listFilesEl.querySelector('.selected');

        if (firstLi) {
          let indexStart;
          let indexEnd;
          let lis = li.parentElement.childNodes;

          lis.forEach((el, index) => {
            if (firstLi === el) indexStart = index;
            if (li === el) indexEnd = index;
          });

          let index = [indexStart, indexEnd].sort();

          lis.forEach((el, i) => {
            if (i >= index[0] && i <= index[1]) {
              el.classList.add('selected');
            }
          });

          this.listFilesEl.dispatchEvent(this.onselectionchange);
          return true;
        }
      }

      if (!event.ctrlKey) {
        this.listFilesEl.querySelectorAll('li.selected').forEach((el) => {
          el.classList.remove('selected');
        });
      }

      li.classList.toggle('selected');
      this.listFilesEl.dispatchEvent(this.onselectionchange);
    });
  }


}