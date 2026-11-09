/* ============================================================================
   ANOMALY HOSPITAL - Main 3D Game Controller, Skin Shop, Shifts 1-12, & AI
   ============================================================================ */

class AnomalyHospitalGame {
  constructor() {
    this.state = 'menu';
    this.isPaused = false;
    this.gameMode = 'solo';
    this.selectedChar = window.GAME_DATA.characters[0]; // Default free starter: Intern Rascal
    this.playerNickname = 'Dr. Paws';
    this.playerSkinHex = '#38bdf8';

    // Persistent Hospital Coins, Premium Anomaly Coins, & Unlocked Skins (Saved in localStorage)
    this.loadPersistentProfile();

    // Progression & Shift Stats
    this.currentShift = 1;
    this.cash = 50;
    this.strikesRemaining = 3;
    this.playerContributionScore = 0;

    // Sanity / Heart System
    this.heartIndex = 1;
    this.heart1Depleted = false;
    this.sanity = 100;
    this.isDowned = false;
    this.isHiding = false;

    // Cooldowns & Equipment
    this.milkCooldown = 0;
    this.taserCooldown = 0;
    this.hasTaserEquipped = false;
    this.hasInfiniteGun = false;
    this.hasUVCamera = false;
    this.uvModeActive = false;
    this.flashlightOn = true;
    this.isRunning = false;
    this.permanentSpeedBoost = 1.0;
    this.hasWheelbed = false;
    this.samHired = false;
    this.stationGunHolder = null;

    // Story Flags across Shifts 1-12
    this.barneyAccepted = true;
    this.hasRathewKey = false;
    this.posterBroken = false;
    this.hasRattinaPhoto = false;
    this.managerOfficeUnlocked = false;
    this.isDiscoFinale = false;

    // Held Item(s) in Hand (Supports 2-Item Carry Capacity for Nurse Assistant & Head Nurse!)
    this.heldItem = null;
    this.secondaryHeldItem = null;
    this.printedCardOnTray = null;

    // Active Patients & Shift Queue
    this.shiftQueue = [];
    this.currentLobbyPatient = null;
    this.activePatients = [];
    this.walkingOutPatients = []; // Recovered normal patients walking out & disappearing cleanly!
    this.environmentalAnomalies = [];
    this.shiftStats = { recovered: 0, declined: 0, deaths: 0, anomaliesNeutralized: 0 };

    // CCTV & Lighting State
    this.cctvBroken = { reception: false, corridor: false };
    this.blackoutActive = false;
    this.flickerTimer = 0;
    this.ceilingMonsterActive = false;
    this.ceilingLookTimer = 0;
    this.underBedGrabState = null;
    this.shift12Phase = 'none';
    this.shift12Timer = 0;
    this.bossEntity = null;

    // Player 3D Transform & Input
    this.player = {
      pos: new THREE.Vector3(0, 1.68, 10.5),
      yaw: 0,
      pitch: 0
    };
    this.keys = {};
    this.touchMove = { x: 0, y: 0 };
    this.useDpadMode = false;
    this.compassTargetPos = new THREE.Vector3(0, 1.5, 6.4);
    this.compassTargetLabel = 'Registration Desk';

    this.initThreeJS();
    this.coop = new window.CoopMultiplayerManager(this);
    this.coop.initFromURL();
    this.bindUIEvents();
    this.populateMainMenu();
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.animate(t));
  }

  loadPersistentProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem('anomaly_hospital_profile_v2') || '{}');
      this.hospitalCoins = typeof saved.hospitalCoins === 'number' ? saved.hospitalCoins : 17;
      this.premiumCoins = typeof saved.premiumCoins === 'number' ? saved.premiumCoins : 0;
      // Only default beginner character ('intern_rascal') and default beginner uniform ('skin_blue') start unlocked!
      this.unlockedChars = Array.isArray(saved.unlockedChars)
        ? saved.unlockedChars
        : ['intern_rascal'];
      if (!this.unlockedChars.includes('intern_rascal')) {
        this.unlockedChars.push('intern_rascal');
      }
      this.unlockedSkins = Array.isArray(saved.unlockedSkins)
        ? saved.unlockedSkins
        : ['skin_blue'];
      if (!this.unlockedSkins.includes('skin_blue')) {
        this.unlockedSkins.push('skin_blue');
      }
    } catch (e) {
      this.hospitalCoins = 17;
      this.premiumCoins = 0;
      this.unlockedChars = ['intern_rascal'];
      this.unlockedSkins = ['skin_blue'];
    }
  }

  savePersistentProfile() {
    try {
      localStorage.setItem(
        'anomaly_hospital_profile_v2',
        JSON.stringify({
          hospitalCoins: this.hospitalCoins,
          premiumCoins: this.premiumCoins,
          unlockedChars: this.unlockedChars,
          unlockedSkins: this.unlockedSkins
        })
      );
    } catch (e) {}
  }

  awardHospitalCoins(amount) {
    this.hospitalCoins += amount;
    this.savePersistentProfile();
    this.updateCurrencyBarUI();
  }

  exchangeCoinsForPremium() {
    window.hospitalAudio.playUIButton();
    if (this.hospitalCoins < 20) {
      alert(`Need 20 Hospital Coins to exchange for 1 Premium Anomaly Coin! (You currently have ${this.hospitalCoins} Hospital Coins). Play shifts & heal patients to earn coins!`);
      return;
    }
    this.hospitalCoins -= 20;
    this.premiumCoins += 1;
    this.savePersistentProfile();
    this.populateMainMenu();
  }

  updateCurrencyBarUI() {
    const hcEl = document.getElementById('hospital-coins-count');
    const pcEl = document.getElementById('premium-coins-count');
    if (hcEl) hcEl.textContent = this.hospitalCoins;
    if (pcEl) pcEl.textContent = this.premiumCoins;
  }

  initThreeJS() {
    const canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070c14);
    this.scene.fog = new THREE.FogExp2(0x070c14, 0.022);

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 90);
    this.scene.add(this.camera);

    this.flashlight = new THREE.SpotLight(0xffffff, 2.8, 28, Math.PI / 4.2, 0.35, 1.0);
    this.flashlight.position.set(0.2, -0.15, 0);
    this.flashlight.target.position.set(0, 0, -5);
    this.camera.add(this.flashlight);
    this.camera.add(this.flashlight.target);

    this.fpHandGroup = new THREE.Group();
    this.fpHandGroup.position.set(0.38, -0.32, -0.65);
    this.camera.add(this.fpHandGroup);

    window.HospitalWorldBuilder.buildHospital(this);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  registerInteractable(obj) {
    const signEl = document.createElement('div');
    signEl.className = 'world-sign' + (obj.isDanger ? ' sign-danger' : '');
    signEl.innerHTML = `<span class="key-badge">E</span>${obj.name}`;
    signEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.state === 'playing' && !this.isPaused) {
        obj.action();
      }
    });
    signEl.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (this.state === 'playing' && !this.isPaused) {
        obj.action();
      }
    }, { passive: false });

    document.getElementById('world-labels-container').appendChild(signEl);
    obj.signEl = signEl;
    this.interactables.push(obj);
  }

  // Populate Character Skin Shop & Uniform Skin Colors (Default free, others cost coins!)
  populateMainMenu() {
    this.updateCurrencyBarUI();

    const charList = document.getElementById('char-select-list');
    if (charList) {
      charList.innerHTML = '';
      window.GAME_DATA.characters.forEach((ch) => {
        const isUnlocked = ch.cost === 0 || this.unlockedChars.includes(ch.id);
        const isEquipped = this.selectedChar.id === ch.id;

        const div = document.createElement('div');
        div.className = 'char-card' + (isEquipped ? ' selected' : '');

        let btnClass = 'equip-btn';
        let btnLabel = 'EQUIP SKIN';
        if (isEquipped) {
          btnClass = 'equipped-btn';
          btnLabel = 'EQUIPPED ✓';
        } else if (!isUnlocked) {
          if (ch.costType === 'premium') {
            btnClass = 'buy-premium-btn';
            btnLabel = `💎 Buy (${ch.cost} Premium Coins)`;
          } else {
            btnClass = 'buy-hospital-btn';
            btnLabel = `🪙 Buy (${ch.cost} Hospital Coins)`;
          }
        }

        div.innerHTML = `
          <div class="char-card-header">
            <div>
              <span class="char-card-title">${ch.icon} ${ch.name}</span>
              <span class="char-card-subtitle"> — ${ch.subtitle}</span>
            </div>
            <button class="skin-action-btn ${btnClass}">${btnLabel}</button>
          </div>
          <div class="char-card-perk">Perk: ${ch.perk}</div>
          <div class="char-card-lore">${ch.lore}</div>
        `;

        div.onclick = () => {
          window.hospitalAudio.playUIButton();
          if (isUnlocked) {
            this.selectedChar = ch;
            this.populateMainMenu();
          } else {
            // Attempt purchase with coins
            if (ch.costType === 'premium') {
              if (this.premiumCoins < ch.cost) {
                alert(`Need ${ch.cost} Premium Anomaly Coins to unlock ${ch.name}! (You have ${this.premiumCoins} 💎). Convert Hospital Coins or complete shifts!`);
                return;
              }
              this.premiumCoins -= ch.cost;
            } else {
              if (this.hospitalCoins < ch.cost) {
                alert(`Need ${ch.cost} Hospital Coins to unlock ${ch.name}! (You have ${this.hospitalCoins} 🪙). Treat patients in shifts to earn coins!`);
                return;
              }
              this.hospitalCoins -= ch.cost;
            }
            this.unlockedChars.push(ch.id);
            this.selectedChar = ch;
            this.savePersistentProfile();
            this.populateMainMenu();
          }
        };

        charList.appendChild(div);
      });
    }

    const skinList = document.getElementById('skin-select-list');
    if (skinList) {
      skinList.innerHTML = '';
      window.GAME_DATA.playerSkins.forEach((sk) => {
        const isUnlocked = sk.cost === 0 || this.unlockedSkins.includes(sk.id);
        const isSelected = this.playerSkinHex === sk.hex;

        const sw = document.createElement('div');
        sw.className = 'skin-swatch-item' + (isSelected ? ' selected' : '');
        const priceTag = isUnlocked ? (isSelected ? '✓ Equipped' : 'Unlocked') : `🪙 ${sk.cost}`;
        sw.innerHTML = `
          <span class="skin-swatch-dot" style="background:${sk.hex};"></span>
          <span>${sk.name} (${priceTag})</span>
        `;
        sw.onclick = () => {
          window.hospitalAudio.playUIButton();
          if (isUnlocked) {
            this.playerSkinHex = sk.hex;
            this.populateMainMenu();
          } else {
            if (this.hospitalCoins < sk.cost) {
              alert(`Need ${sk.cost} Hospital Coins to unlock the ${sk.name} uniform! (You have ${this.hospitalCoins} 🪙).`);
              return;
            }
            this.hospitalCoins -= sk.cost;
            this.unlockedSkins.push(sk.id);
            this.playerSkinHex = sk.hex;
            this.savePersistentProfile();
            this.populateMainMenu();
          }
        };
        skinList.appendChild(sw);
      });
    }
  }

  bindUIEvents() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      this.keys[code] = true;
      if (this.state !== 'playing') return;

      if (code === 'KeyP' || code === 'Escape') {
        this.togglePause();
        return;
      }
      if (this.isPaused) return;

      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        this.setRunningState(true);
      } else if (code === 'KeyE') {
        this.triggerNearestInteract();
      } else if (code === 'KeyT' || code === 'KeyQ') {
        this.useWeaponOrTaser();
      } else if (code === 'KeyF') {
        this.toggleFlashlight();
      } else if (code === 'KeyC') {
        this.takePatientSnapshot(false);
      } else if (code === 'KeyU') {
        this.toggleUVLight();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.setRunningState(false);
      }
    });

    const canvas = document.getElementById('game-canvas');
    let isDraggingLook = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    canvas.addEventListener('mousedown', (e) => {
      if (this.state !== 'playing' || this.isPaused) return;
      isDraggingLook = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      if (canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    });

    window.addEventListener('mouseup', () => {
      isDraggingLook = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.state !== 'playing' || this.isPaused) return;
      if (document.pointerLockElement === canvas) {
        this.rotateCamera(-e.movementX * 0.0024, -e.movementY * 0.0022);
      } else if (isDraggingLook) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        this.rotateCamera(-dx * 0.004, -dy * 0.0035);
      }
    });

    this.setupTouchControls();

    const exchangeBtn = document.getElementById('btn-exchange-coins');
    if (exchangeBtn) {
      exchangeBtn.onclick = () => this.exchangeCoinsForPremium();
    }

    document.getElementById('btn-start-game').onclick = () => {
      window.hospitalAudio.init();
      window.hospitalAudio.playUIButton();
      this.startNewGameFromShift1();
    };

    document.getElementById('btn-copy-invite').onclick = () => {
      const codeInput = document.getElementById('coop-room-code');
      this.coop.connectChannel(codeInput.value.trim() || this.coop.roomCode);
      const link = this.coop.generateInviteLink();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(link);
      }
      this.showToast('Co-op Invite Link copied! Open link in another tab/device to play together.');
    };

    document.getElementById('btn-open-guide').onclick = () => {
      document.getElementById('guide-modal').style.display = 'flex';
    };
    document.getElementById('btn-hud-guide').onclick = () => {
      document.getElementById('guide-modal').style.display = 'flex';
    };
    document.getElementById('btn-close-guide').onclick = () => {
      document.getElementById('guide-modal').style.display = 'none';
    };

    document.getElementById('btn-toggle-move-mode').onclick = () => {
      this.useDpadMode = !this.useDpadMode;
      document.getElementById('joystick-base').style.display = this.useDpadMode ? 'none' : 'flex';
      document.getElementById('dpad-container').style.display = this.useDpadMode ? 'block' : 'none';
      document.getElementById('btn-toggle-move-mode').textContent = this.useDpadMode
        ? '🎮 Move: D-Pad'
        : '🕹️ Move: Joystick';
    };

    document.getElementById('btn-pause').onclick = () => this.togglePause();
    document.getElementById('btn-resume').onclick = () => this.togglePause();
    document.getElementById('btn-exit-menu').onclick = () => this.exitToMainMenu();
    document.getElementById('btn-pause-exit').onclick = () => this.exitToMainMenu();

    document.getElementById('act-interact').onclick = () => this.triggerNearestInteract();
    document.getElementById('act-taser').onclick = () => this.useWeaponOrTaser();
    document.getElementById('act-flashlight').onclick = () => this.toggleFlashlight();
    document.getElementById('act-run').onclick = () => this.setRunningState(!this.isRunning);
    document.getElementById('act-camera').onclick = () => this.takePatientSnapshot(false);
    document.getElementById('act-uv').onclick = () => this.toggleUVLight();

    document.getElementById('context-prompt').onclick = () => this.triggerNearestInteract();

    document.getElementById('btn-confirm-print-tag').onclick = () => this.confirmAndPrintPatientTag();
    document.getElementById('btn-close-cctv').onclick = () => {
      document.getElementById('cctv-modal').style.display = 'none';
    };
    document.getElementById('btn-close-polaroid').onclick = () => {
      document.getElementById('polaroid-modal').style.display = 'none';
    };
    document.getElementById('btn-close-shop').onclick = () => {
      document.getElementById('shop-modal').style.display = 'none';
    };
  }

  setupTouchControls() {
    const joyBase = document.getElementById('joystick-base');
    const joyKnob = document.getElementById('joystick-knob');
    let joyTouchId = null;

    const updateJoystick = (clientX, clientY) => {
      const rect = joyBase.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const maxR = 44;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }
      joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.touchMove.x = dx / maxR;
      this.touchMove.y = -dy / maxR;
    };

    joyBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      joyTouchId = t.identifier;
      updateJoystick(t.clientX, t.clientY);
    }, { passive: false });

    joyBase.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === joyTouchId) {
          updateJoystick(t.clientX, t.clientY);
        }
      }
    }, { passive: false });

    const resetJoystick = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyTouchId) {
          joyTouchId = null;
          joyKnob.style.transform = 'translate(0px, 0px)';
          this.touchMove.x = 0;
          this.touchMove.y = 0;
        }
      }
    };
    joyBase.addEventListener('touchend', resetJoystick);
    joyBase.addEventListener('touchcancel', resetJoystick);

    const bindDpad = (id, vx, vy) => {
      const btn = document.getElementById(id);
      const start = (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        this.touchMove.x = vx;
        this.touchMove.y = vy;
      };
      const end = (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        this.touchMove.x = 0;
        this.touchMove.y = 0;
      };
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
    };
    bindDpad('dpad-up', 0, 1);
    bindDpad('dpad-down', 0, -1);
    bindDpad('dpad-left', -1, 0);
    bindDpad('dpad-right', 1, 0);

    const lookZone = document.getElementById('touch-look-zone');
    let lookTouchId = null;
    let lastTouchX = 0;
    let lastTouchY = 0;

    lookZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      lookTouchId = t.identifier;
      lastTouchX = t.clientX;
      lastTouchY = t.clientY;
    }, { passive: false });

    lookZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.state !== 'playing' || this.isPaused) return;
      for (const t of e.changedTouches) {
        if (t.identifier === lookTouchId) {
          const dx = t.clientX - lastTouchX;
          const dy = t.clientY - lastTouchY;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
          this.rotateCamera(-dx * 0.0052, -dy * 0.0045);
        }
      }
    }, { passive: false });

    lookZone.addEventListener('touchend', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === lookTouchId) lookTouchId = null;
      }
    });
  }

  rotateCamera(deltaYaw, deltaPitch) {
    this.player.yaw += deltaYaw;
    this.player.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.player.pitch + deltaPitch));
  }

  // ==========================================================================
  // GAME START, SHIFT 1-12 INITIALIZATION, & EXIT TO MENU (RESET TO SHIFT 1)
  // ==========================================================================
  startNewGameFromShift1() {
    const nickInput = document.getElementById('player-nickname-input');
    this.playerNickname = (nickInput && nickInput.value.trim()) || 'Dr. Paws';
    const modeSelect = document.getElementById('game-mode-select');
    this.gameMode = modeSelect ? modeSelect.value : 'solo';

    this.currentShift = 1;
    this.cash = 50;
    this.hasTaserEquipped = !!this.selectedChar.startsWithTaser;
    this.hasInfiniteGun = false;
    this.hasUVCamera = !!this.selectedChar.startsWithUV;
    this.permanentSpeedBoost = this.selectedChar.speedMult || 1.0;
    this.hasRathewKey = false;
    this.posterBroken = false;
    this.hasRattinaPhoto = false;
    this.managerOfficeUnlocked = false;
    this.samHired = false;
    this.isDiscoFinale = false;
    window.hospitalAudio.stopDiscoMusic();

    this.heartIndex = 1;
    this.heart1Depleted = false;
    this.sanity = 100;
    this.isDowned = false;

    document.getElementById('main-menu-modal').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    this.state = 'playing';
    this.isPaused = false;

    this.coop.spawnAICoopPartnerIfNeeded();
    this.beginShift(1);
  }

  exitToMainMenu() {
    if (document.pointerLockElement) document.exitPointerLock();
    window.hospitalAudio.stopDiscoMusic();
    this.clearShiftEntities();
    this.coop.clearPeers();
    this.state = 'menu';
    this.isPaused = false;
    this.currentShift = 1;
    document.getElementById('hud').style.display = 'none';
    document.getElementById('pause-modal').style.display = 'none';
    document.getElementById('summary-modal').style.display = 'none';
    document.getElementById('disco-banner').style.display = 'none';
    this.populateMainMenu();
    document.getElementById('main-menu-modal').style.display = 'flex';
  }

  togglePause() {
    if (this.state !== 'playing') return;
    this.isPaused = !this.isPaused;
    if (this.isPaused && document.pointerLockElement) {
      document.exitPointerLock();
    }
    document.getElementById('pause-modal').style.display = this.isPaused ? 'flex' : 'none';
  }

  clearShiftEntities() {
    if (this.currentLobbyPatient && this.currentLobbyPatient.mesh) {
      this.scene.remove(this.currentLobbyPatient.mesh);
    }
    this.currentLobbyPatient = null;

    this.activePatients.forEach((p) => {
      if (p.mesh) this.scene.remove(p.mesh);
    });
    this.activePatients = [];

    this.walkingOutPatients.forEach((p) => {
      if (p.mesh) this.scene.remove(p.mesh);
    });
    this.walkingOutPatients = [];

    this.environmentalAnomalies.forEach((a) => {
      if (a.mesh) this.scene.remove(a.mesh);
    });
    this.environmentalAnomalies = [];

    if (this.printedCardOnTray && this.printedCardOnTray.mesh) {
      this.scene.remove(this.printedCardOnTray.mesh);
    }
    this.printedCardOnTray = null;

    if (this.bossEntity && this.bossEntity.mesh) {
      this.scene.remove(this.bossEntity.mesh);
    }
    this.bossEntity = null;

    this.wardRooms.forEach((r) => {
      if (r.patient && r.patient.mesh) {
        this.scene.remove(r.patient.mesh);
      }
      if (r.lastPatientMesh) {
        this.scene.remove(r.lastPatientMesh);
        r.lastPatientMesh = null;
      }
      r.patient = null;
      r.signMat.color.setHex(0x22c55e);
      r.signMat.emissive.setHex(0x064e3b);
      r.hasBedMonster = false;
      r.bedMonsterZone.visible = false;
      r.deathRitualActive = false;
      r.ritualCandles.forEach((c) => this.scene.remove(c));
      r.ritualCandles = [];
      if (r.ceilingMonsterMesh) {
        this.scene.remove(r.ceilingMonsterMesh);
        r.ceilingMonsterMesh = null;
      }
      r.hasCeilingMonster = false;
    });

    this.emergencyRooms.forEach((er) => {
      if (er.patient && er.patient.mesh) {
        this.scene.remove(er.patient.mesh);
      }
      er.patient = null;
      er.timer = 60;
    });
  }

  beginShift(shiftNumber) {
    this.clearShiftEntities();
    this.currentShift = shiftNumber;
    const cfg = window.GAME_DATA.shifts[shiftNumber - 1] || window.GAME_DATA.shifts[0];

    this.strikesRemaining = 3;
    this.playerContributionScore = 0;
    this.shiftStats = { recovered: 0, declined: 0, deaths: 0, anomaliesNeutralized: 0 };
    this.underBedGrabState = null;
    this.shift12Phase = 'none';
    this.discoBallMesh.visible = false;
    document.getElementById('disco-banner').style.display = 'none';
    document.getElementById('big-countdown-banner').style.display = 'none';

    if (this.selectedChar.startsWithTaser) {
      this.hasTaserEquipped = true;
      this.setHeldItem({
        id: 'taser',
        name: 'Electric Taser (Auto-Targets Chasing Anomalies)',
        icon: '⚡',
        color: 0xfacc15
      });
    }

    this.player.pos.set(0, 1.68, 10.2);
    this.player.yaw = 0;
    this.player.pitch = 0;

    if (shiftNumber > 1) {
      this.modifySanity(-8, 'New Shift Fatigue');
    }

    this.blackoutActive = !!cfg.lightsOff;
    this.updateHospitalLighting();

    this.managerBoxMesh.visible = shiftNumber === 6 && !this.managerOfficeUnlocked;

    if (shiftNumber === 12) {
      this.managerDoorMesh.material.color.setHex(0x991b1b);
      this.managerDoorMesh.material.emissive = new THREE.Color(0x450a0a);
    } else {
      this.managerDoorMesh.material.color.setHex(0x78350f);
      this.managerDoorMesh.material.emissive = new THREE.Color(0x000000);
    }

    this.shiftQueue = [];
    for (let i = 0; i < cfg.normalCount; i++) {
      this.shiftQueue.push(this.generatePatientDescriptor(false, cfg));
    }
    for (let i = 0; i < cfg.anomalyCount; i++) {
      this.shiftQueue.push(this.generatePatientDescriptor(true, cfg));
    }
    this.shiftQueue.sort(() => Math.random() - 0.5);

    if (shiftNumber === 3) {
      this.shiftQueue.unshift(this.generatePatientDescriptor(false, cfg, 'rathew'));
      setTimeout(() => this.triggerBarneyVisit(3), 4000);
    } else if (shiftNumber === 4) {
      this.shiftQueue.unshift(this.generatePatientDescriptor(false, cfg, 'rathew_faint'));
      setTimeout(() => this.triggerBarneyVisit(4), 3500);
    } else if (shiftNumber === 5) {
      setTimeout(() => this.triggerShift5AmbulanceRush(), 1500);
      setTimeout(() => this.triggerBarneyVisit(5), 5000);
    } else if (shiftNumber === 7) {
      this.shiftQueue.splice(1, 0, this.generatePatientDescriptor(true, cfg, 'rattina_stalker'));
    } else if (shiftNumber >= 10) {
      if (!this.hasUVCamera) {
        this.hasUVCamera = true;
        this.showStoryModal(
          'Liz (Lisbeth) — Bio-Research Division',
          '“Doctor! Take this UV Camera [U]. Some late-stage Animal Corporation anomalies look completely normal on standard film and CCTV, but under Ultraviolet light their bioluminescent infection marks glow bright purple!”',
          [{ label: 'Accept UV Camera [U]', action: () => {} }]
        );
      }
      if (cfg.slimebertActive) {
        this.spawnSlimebert();
      }
    }

    this.setupShiftEnvironmentalAnomalies(cfg);

    this.showToast(cfg.storyNote, 7000);
    this.updateHUD();

    if (!cfg.ambulanceEvent) {
      setTimeout(() => this.spawnNextLobbyPatient(), 1200);
    }
  }

  generatePatientDescriptor(isAnomaly, cfg, specialType = null) {
    const first = window.GAME_DATA.patientFirstNames[
      Math.floor(Math.random() * window.GAME_DATA.patientFirstNames.length)
    ];
    const last = window.GAME_DATA.patientLastNames[
      Math.floor(Math.random() * window.GAME_DATA.patientLastNames.length)
    ];
    const color = window.GAME_DATA.safeColors[
      Math.floor(Math.random() * window.GAME_DATA.safeColors.length)
    ];
    const species = window.GAME_DATA.species[
      Math.floor(Math.random() * window.GAME_DATA.species.length)
    ];

    const medCount = Math.min(3, 1 + Math.floor(Math.random() * (this.currentShift >= 4 ? 3 : 2)));
    const shuffledMeds = [...window.GAME_DATA.wardMedicines].sort(() => Math.random() - 0.5);
    const requiredMeds = shuffledMeds.slice(0, medCount).map((m) => ({ ...m, given: false }));

    let anomalyDetectionType = 'none';
    if (isAnomaly) {
      const r = Math.random() * 35;
      if (this.currentShift === 2) {
        anomalyDetectionType = Math.random() < 0.5 ? 'cctv' : 'photo_horrific';
      } else if (r < 15) {
        anomalyDetectionType = 'cctv';
      } else if (r < 22.5) {
        anomalyDetectionType = 'photo_subtle';
      } else if (r < 30) {
        anomalyDetectionType = 'photo_horrific';
      } else {
        anomalyDetectionType = this.hasUVCamera || this.currentShift >= 10 ? 'uv' : 'photo_horrific';
      }
    }

    if (specialType === 'rathew' || specialType === 'rathew_faint') {
      return {
        id: 'pat_rathew_' + Date.now(),
        name: 'Rathew (Twin Brother)',
        species: { id: 'bear', label: 'Black Rat' },
        color: { name: 'Charcoal Black', hex: '#1e242b', num: 0x1e242b },
        isAnomaly: false,
        anomalyDetectionType: 'none',
        specialType,
        requiredMeds: [
          { ...window.GAME_DATA.wardMedicines[0], given: false },
          { ...window.GAME_DATA.wardMedicines[4], given: false }
        ],
        fainted: specialType === 'rathew_faint',
        state: 'lobby'
      };
    }

    if (specialType === 'rattina_stalker') {
      return {
        id: 'pat_rattina_' + Date.now(),
        name: 'Rattina [CORRUPTED]',
        species: { id: 'rabbit', label: 'Stalker Entity' },
        color: { name: 'Pale Lavender', hex: '#c084fc', num: 0xc084fc },
        isAnomaly: true,
        anomalyDetectionType: 'photo_horrific',
        specialType: 'rattina_stalker',
        hasRibbon: true,
        requiredMeds: [{ ...window.GAME_DATA.wardMedicines[7], given: false }],
        fainted: false,
        state: 'lobby'
      };
    }

    return {
      id: 'pat_' + Math.random().toString(36).substring(2, 8),
      name: `${first} ${last}`,
      species,
      color,
      isAnomaly,
      anomalyDetectionType,
      specialType: null,
      requiredMeds,
      fainted: Math.random() < 0.12 && this.currentShift >= 3,
      state: 'lobby'
    };
  }

  // ==========================================================================
  // SEQUENTIAL LOBBY PATIENT SPAWN, SNAPSHOT, CCTV, & 3D ID CARD PRINTING
  // ==========================================================================
  spawnNextLobbyPatient() {
    if (this.state !== 'playing' || this.currentLobbyPatient) return;

    if (this.shiftQueue.length === 0 && this.activePatients.length === 0) {
      this.checkShiftCompletion();
      return;
    }

    if (this.shiftQueue.length === 0) return;

    const pData = this.shiftQueue.shift();
    const mesh = window.HospitalModels.createAnimalPatientMesh(pData);
    mesh.position.set(-1.2, 0, 4.3);
    mesh.rotation.y = 0;

    if (pData.fainted) {
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.25;
      this.showToast(`${pData.name} fainted at Registration! Pick them up [E] to carry to a bed or trash.`);
    }

    if (pData.specialType === 'rattina_stalker') {
      mesh.rotation.x = 0.38;
      this.triggerFlickerHazard();
      this.showToast("WARNING: The Stalker checked in! She is bending down blocking the shutters—take a Camera photo [C] or give her Rattina's Photo!");
    }

    this.scene.add(mesh);
    pData.mesh = mesh;
    pData.photoTaken = false;
    pData.tagPrinted = false;
    this.currentLobbyPatient = pData;

    this.setObjectiveCompass(
      new THREE.Vector3(-4.2, 1.4, 6.5),
      `Take Polaroid Snapshot of ${pData.name} at Camera`
    );
    this.updateHUD();
  }

  takePatientSnapshot(forceFromUI = false) {
    window.hospitalAudio.playCameraShutter();
    const patient = this.currentLobbyPatient || this.findClosestActivePatient();

    if (this.currentLobbyPatient && this.currentLobbyPatient.specialType === 'rattina_stalker') {
      this.showToast('CAMERA FLASH! The Stalker shrieked and vanished from Reception! (+20 🪙)');
      this.scene.remove(this.currentLobbyPatient.mesh);
      this.currentLobbyPatient = null;
      this.shiftStats.anomaliesNeutralized++;
      this.playerContributionScore += 3;
      this.awardHospitalCoins(20);
      setTimeout(() => this.spawnNextLobbyPatient(), 2000);
      this.updateHUD();
      return;
    }

    const modal = document.getElementById('polaroid-modal');
    const canvas = document.getElementById('polaroid-canvas');
    const caption = document.getElementById('polaroid-caption');

    window.HospitalModels.renderPatientSnapshot(canvas, patient, 'polaroid', this.uvModeActive);

    if (patient) {
      patient.photoTaken = true;
      let statusHint = `${patient.name} (${patient.species.label})`;
      if (patient.anomalyDetectionType === 'photo_horrific') {
        statusHint += ' — [!] UNCANNY WIDE RED EYES DETECTED!';
        this.modifySanity(-5, 'Horrific Polaroid Photo');
      } else if (patient.anomalyDetectionType === 'photo_subtle') {
        statusHint += ' — [?] Compare ear/head shape closely with patient!';
      } else if (this.uvModeActive && patient.anomalyDetectionType === 'uv') {
        statusHint += ' — [!] UV BIOLUMINESCENT INFECTION DETECTED!';
      }
      caption.textContent = statusHint;
      this.setObjectiveCompass(
        new THREE.Vector3(-0.8, 1.4, 6.5),
        'Check CCTV PC & Click Confirm & Print Tag (or Shutters to Decline)'
      );
    } else {
      caption.textContent = 'Empty Snapshot (No Patient at Window)';
    }

    modal.style.display = 'flex';
    this.updateHUD();
  }

  openCCTVTerminal() {
    if (this.cctvBroken.reception || this.cctvBroken.corridor) {
      const brokenWhere = this.cctvBroken.reception ? 'Reception Relay Box' : 'Main Corridor Relay Box';
      this.showToast(`CCTV Signal Lost! Go repair the ${brokenWhere} with [E] first!`);
      return;
    }

    window.hospitalAudio.playUIButton();
    const modal = document.getElementById('cctv-modal');
    const canvas = document.getElementById('cctv-canvas');
    const paper = document.getElementById('clipboard-content');
    const p = this.currentLobbyPatient;

    if (this.currentShift >= 2) {
      window.HospitalModels.renderPatientSnapshot(canvas, p, 'cctv', this.uvModeActive);
    } else {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CCTV ACTIVATES IN SHIFT 2 (ALL SHIFT 1 PATIENTS NORMAL)', canvas.width / 2, canvas.height / 2);
    }

    if (!p) {
      paper.className = 'clipboard-paper';
      paper.innerHTML = '<h4>WAITING FOR NEXT PATIENT...</h4><p>No patient currently standing at Registration.</p>';
    } else if (p.specialType === 'rattina_stalker') {
      paper.className = 'clipboard-paper corrupted';
      paper.innerHTML = `
        <h4>▓▒░ ANIMAL CORPORATION ░▒▓</h4>
        <p><strong>APPLICANT:</strong> RATTINA [REDACTED]</p>
        <p><strong>POSITION:</strong> LAB SUBJECT / STALKER</p>
        <p><strong>SYMPTOMS:</strong> DON'T LOOK AT THE SHUTTERS. TAKE MY PHOTO OR BURN MY MEMORY.</p>
      `;
    } else {
      paper.className = 'clipboard-paper';
      const medList = p.requiredMeds.map((m) => `<li>${m.icon} <strong>${m.name}</strong> (${m.symptom})</li>`).join('');
      paper.innerHTML = `
        <h4 style="margin:0 0 8px 0;color:#0284c7;">ANIMAL HOSPITAL CHECK-IN RECORD</h4>
        <p style="margin:4px 0;"><strong>Patient Name:</strong> ${p.name}</p>
        <p style="margin:4px 0;"><strong>Species / Fur:</strong> ${p.species.label} (${p.color.name})</p>
        <p style="margin:6px 0 4px 0;"><strong>Required Treatment Items:</strong></p>
        <ul style="margin:0;padding-left:18px;">${medList}</ul>
      `;
    }

    modal.style.display = 'flex';
  }

  confirmAndPrintPatientTag() {
    const p = this.currentLobbyPatient;
    if (!p) {
      this.showToast('No patient at Registration to print a tag for!');
      return;
    }
    if (p.specialType === 'rattina_stalker') {
      this.showToast('ERROR: Cannot print ID Tag for corrupted Animal Corporation application!');
      return;
    }

    window.hospitalAudio.playPrinterSound();
    document.getElementById('cctv-modal').style.display = 'none';

    if (this.printedCardOnTray && this.printedCardOnTray.mesh) {
      this.scene.remove(this.printedCardOnTray.mesh);
    }
    const cardMesh = window.HospitalModels.create3DPatientIDCard(p.name);
    cardMesh.position.set(1.4, 1.18, 6.78);
    this.scene.add(cardMesh);

    this.printedCardOnTray = { patient: p, mesh: cardMesh };
    p.tagPrinted = true;

    this.showToast(`3D ID Card printed for ${p.name}! Walk to the Printer [E] to pick up the Patient ID Tag.`);
    this.setObjectiveCompass(
      new THREE.Vector3(1.4, 1.35, 6.6),
      `Pick up ${p.name}'s 3D ID Card from Printer [E]`
    );
    this.updateHUD();
  }

  interactWithPrinter() {
    if (!this.printedCardOnTray && this.currentLobbyPatient) {
      this.confirmAndPrintPatientTag();
      return;
    }

    if (this.printedCardOnTray) {
      const p = this.printedCardOnTray.patient;
      this.scene.remove(this.printedCardOnTray.mesh);
      this.printedCardOnTray = null;

      this.setHeldItem({
        id: 'patient_id_tag',
        name: `Patient ID Tag: ${p.name}`,
        icon: '🪪',
        patient: p
      });

      const freeRoom = this.wardRooms.find((r) => !r.patient);
      const targetPos = freeRoom ? freeRoom.pos : new THREE.Vector3(-8.5, 1.2, -3.0);
      this.showToast(`Picked up ${p.name}'s 3D ID Card! Interact [E] with the patient or any Ward Bed (Room 101-108) to assign them.`);
      this.setObjectiveCompass(
        targetPos,
        `Hand ID Card [E] to ${p.name} or Ward Bed (Room ${freeRoom ? freeRoom.roomNumber : 101})`
      );
      this.updateHUD();
    } else {
      this.showToast('Printer tray is empty. Click "Confirm & Print Tag" on the Registration PC first!');
    }
  }

  declineCurrentPatient() {
    const p = this.currentLobbyPatient;
    if (!p) {
      this.showToast('No patient at Registration to decline.');
      return;
    }

    if (p.specialType === 'rattina_stalker') {
      this.showToast('SHUTTERS BLOCKED! The Stalker is staring at you—take her photo with the Camera [C]!');
      return;
    }

    window.hospitalAudio.playUIButton();
    this.shutterMesh.position.y = 2.05;
    setTimeout(() => {
      if (this.shutterMesh) this.shutterMesh.position.y = 3.65;
    }, 1400);

    this.showToast(`${p.name}: "Hmph! Unbelievable service!" — Patient declined and left the hospital.`);
    if (p.mesh) this.scene.remove(p.mesh);
    if (this.printedCardOnTray && this.printedCardOnTray.patient === p) {
      this.scene.remove(this.printedCardOnTray.mesh);
      this.printedCardOnTray = null;
    }
    this.currentLobbyPatient = null;
    this.shiftStats.declined++;
    this.playerContributionScore += 1;
    this.updateHUD();

    setTimeout(() => this.spawnNextLobbyPatient(), 2000);
  }

  // ==========================================================================
  // ROOM ASSIGNMENT, BEDSIDE MEDICINE TREATMENT, & CLEAN RECOVERY / LEAVE LOOP
  // ==========================================================================
  assignPatientToWardRoom(patient, room) {
    if (room.patient) {
      this.showToast(`Room ${room.roomNumber} already contains a recovering patient!`);
      return;
    }

    // Fail-safe: Ensure any previous patient mesh on this bed is 100% removed so patients NEVER stack up!
    if (room.lastPatientMesh) {
      this.scene.remove(room.lastPatientMesh);
      room.lastPatientMesh = null;
    }

    if (this.currentLobbyPatient === patient) {
      this.currentLobbyPatient = null;
    }

    room.patient = patient;
    room.lastPatientMesh = patient.mesh;
    patient.assignedRoom = room;
    patient.state = 'in_bed';
    patient.fainted = false;
    patient.recoveryTimer = 0;

    // Room Number Sign turns Glowing RED ("contains patient")
    room.signMat.color.setHex(0xef4444);
    room.signMat.emissive.setHex(0x991b1b);

    // Move patient onto the Ward Bed lying flat
    if (patient.mesh) {
      patient.mesh.position.set(room.pos.x, 0.78, room.pos.z);
      patient.mesh.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    }

    this.consumeHeldItemById(['patient_id_tag', 'carried_patient']);

    const cfg = window.GAME_DATA.shifts[this.currentShift - 1];
    if (cfg && cfg.bedMonster && (patient.isAnomaly || cfg.bedMonsterHighFreq) && Math.random() < 0.55) {
      room.hasBedMonster = true;
      room.bedMonsterZone.visible = true;
    }

    this.activePatients.push(patient);
    const firstMed = patient.requiredMeds.find((m) => !m.given);
    this.showToast(
      `${patient.name} assigned to Room ${room.roomNumber}! Fetch their required medicines from the Hall Shelves.`
    );
    if (firstMed) {
      this.setObjectiveCompass(
        new THREE.Vector3(0, 1.3, -4.5),
        `Get ${firstMed.name} from Hall Shelves for Room ${room.roomNumber}`
      );
    }
    this.updateHUD();

    setTimeout(() => this.spawnNextLobbyPatient(), 2000);
  }

  interactWithWardRoom(room) {
    if (!room.patient) {
      const tagItem = this.findHeldItem((it) => it.id === 'patient_id_tag' || it.id === 'carried_patient');
      if (tagItem) {
        this.assignPatientToWardRoom(tagItem.patient, room);
        return;
      }
      if (this.currentLobbyPatient && this.currentLobbyPatient.tagPrinted) {
        this.assignPatientToWardRoom(this.currentLobbyPatient, room);
        return;
      }
      this.showToast(`Room ${room.roomNumber} is empty. Bring a Patient ID Tag [E] or fainted patient here.`);
      return;
    }

    if (room.deathRitualActive) {
      this.extinguishDeathRitualCandle(room);
      return;
    }

    const bedCalmItem = this.findHeldItem((it) => ['maple_syrup', 'organ', 'transplant'].includes(it.id));
    if (room.hasBedMonster && bedCalmItem) {
      room.hasBedMonster = false;
      room.bedMonsterZone.visible = false;
      this.underBedGrabState = null;
      this.showToast(`Fed ${bedCalmItem.name} to the Under-Bed Monster in Room ${room.roomNumber}! It retreated peacefully.`);
      this.consumeSpecificHeldItem(bedCalmItem);
      this.playerContributionScore += 2;
      return;
    }

    const patient = room.patient;
    if (patient.state === 'recovering') {
      this.showToast(`${patient.name} is recovering (${Math.ceil(patient.recoveryTimer)}s remaining)...`);
      return;
    }

    // Check held medicines (Supports 1 or 2 held items!)
    const heldMeds = this.getHeldMedicines();
    if (heldMeds.length === 0) {
      const needed = patient.requiredMeds
        .filter((m) => !m.given)
        .map((m) => m.name)
        .join(', ');
      this.showToast(`${patient.name} in Room ${room.roomNumber} needs: ${needed}`);
      return;
    }

    // Check if any held medicine matches a required medicine
    let matchingHeld = null;
    let matchingReq = null;
    for (const hm of heldMeds) {
      const req = patient.requiredMeds.find((m) => m.id === hm.id && !m.given);
      if (req) {
        matchingHeld = hm;
        matchingReq = req;
        break;
      }
    }

    if (matchingHeld && matchingReq) {
      window.hospitalAudio.playUIButton();
      matchingReq.given = true;
      this.consumeSpecificHeldItem(matchingHeld);
      this.playerContributionScore += 1;

      const remaining = patient.requiredMeds.filter((m) => !m.given);
      if (remaining.length === 0) {
        patient.state = 'recovering';
        patient.recoveryTimer = this.selectedChar.healTime || 5.0;
        this.showToast(`All medicines given to ${patient.name}! Recovering on bed for ${patient.recoveryTimer}s...`);
      } else {
        this.showToast(
          `Administered ${matchingReq.name}! Still needs: ${remaining.map((m) => m.name).join(', ')}`
        );
      }
      this.updateHUD();
    } else {
      // Wrong Medicine Given!
      this.consumeSpecificHeldItem(heldMeds[0]);
      this.killPatientOrAnomaly(patient, 'Wrong Medicine Administered');
    }
  }

  completePatientBedRecovery(patient) {
    const room = patient.assignedRoom;
    if (room) {
      room.patient = null;
      room.lastPatientMesh = null;
      room.signMat.color.setHex(0x22c55e);
      room.signMat.emissive.setHex(0x064e3b);
      room.hasBedMonster = false;
      room.bedMonsterZone.visible = false;
    }
    patient.assignedRoom = null;

    if (!patient.isAnomaly) {
      // NORMAL PATIENT RECOVERED!
      // Stands up off the bed, walks into the corridor toward the exit, and disappears cleanly so beds NEVER stack!
      if (patient.mesh) {
        patient.mesh.rotation.set(0, 0, 0);
        patient.mesh.position.set(room ? room.doorPos.x : 0, 0, room ? room.doorPos.z : 0);
        patient.leaveTimer = 1.4; // Walks out for 1.4s then is removed from scene
        this.walkingOutPatients.push(patient);
      }

      if (patient.specialType === 'rathew_faint') {
        this.hasRathewKey = true;
        this.showStoryModal(
          'Rathew (Recovered Patient)',
          '“Thank you for saving me, Doctor... I think I won\'t come here for a while. Listen closely: I have a twin sister named Rattina—she was working for Animal Corporation before she vanished. Take this Vault Key. Check behind the poster in Room 104!”',
          [{ label: "Receive Rathew's Vault Key 🔑", action: () => {} }]
        );
      } else {
        this.showToast(`✅ ${patient.name} recovered, stood up, and left the hospital! (+$30 & +15 🪙 Hospital Coins)`);
      }

      this.cash += 30;
      this.awardHospitalCoins(15);
      this.shiftStats.recovered++;
      this.playerContributionScore += 3;
      this.removeActivePatient(patient);
      this.checkShiftCompletion();
      this.updateHUD();
    } else {
      // DISGUISED ANOMALY AWAKENS!
      window.hospitalAudio.playAnomalyScreech();
      this.triggerFlickerHazard();

      if (patient.mesh) {
        patient.mesh.rotation.set(0, 0, 0);
        patient.mesh.position.y = 0;
        patient.mesh.userData.setVisualMode('awakened_red');
      }

      patient.state = 'awakening_pause';
      patient.awakenPauseTimer = 2.0;
      patient.huntPatientTimer = 16.0;
      this.showToast(`⚠️ ANOMALY AWAKENED! ${patient.name} turned RED: "I'M HUNGRY!" — Tase or Shoot [T] now!`);
      this.updateHUD();
    }
  }

  // ==========================================================================
  // TASER, GUN, FIRE EXTINGUISHER, MILK STATION, & SANITY HEARTS
  // ==========================================================================
  drinkMilkAtStation() {
    if (this.milkCooldown > 0) {
      this.showToast(`Milk Station is on shared cooldown (${Math.ceil(this.milkCooldown)}s remaining)!`);
      return;
    }
    window.hospitalAudio.playMilkDrink();
    const healAmt = this.selectedChar.milkBonus || 25;
    this.modifySanity(healAmt, 'Drank Cup of Milk');
    this.milkCooldown = 35;
    this.coop.broadcast('milk_drank', {});
    this.showToast(`Drank fresh Milk (+${healAmt}% Sanity)! Shared Milk Station cooldown: 35s.`);
    this.updateHUD();
  }

  triggerSharedMilkCooldown(friendName) {
    this.milkCooldown = 35;
    this.showToast(`${friendName} drank a cup of Milk! Shared Milk Station cooldown: 35s.`);
    this.updateHUD();
  }

  modifySanity(amount, reason = '') {
    if (this.isDiscoFinale) return;
    if (amount < 0 && this.isHiding) return;

    const actualAmount = amount < 0 ? amount * (this.selectedChar.sanityDrainMult || 1.0) : amount;
    this.sanity = Math.max(0, Math.min(100, this.sanity + actualAmount));

    if (actualAmount < 0) {
      const vig = document.getElementById('damage-vignette');
      vig.style.opacity = '0.85';
      setTimeout(() => {
        if (vig) vig.style.opacity = '0';
      }, 320);
    }

    if (this.sanity <= 0) {
      if (this.gameMode === 'solo') {
        if (this.heartIndex === 1) {
          this.heart1Depleted = true;
          this.heartIndex = 2;
          this.sanity = 100;
          this.showToast('💔 Heart 1 Depleted! Switched to Heart 2 (Final Life — Heart 1 cannot be refilled)!');
        } else {
          this.triggerGameOver('Your Sanity reached 0% on your Second Heart!');
        }
      } else {
        if (!this.isDowned) {
          this.isDowned = true;
          this.showToast('🚨 YOU ARE DOWNED! Waiting for your Co-op Friend to revive you...');
        }
      }
    }
    this.updateHUD();
  }

  completeReviveByFriend(friendName) {
    this.isDowned = false;
    this.sanity = 100;
    this.showToast(`💚 Revived by ${friendName}! Your backup Sanity Heart is restored!`);
    this.updateHUD();
  }

  equipTaserFromStation() {
    this.hasTaserEquipped = true;
    this.setHeldItem({
      id: 'taser',
      name: 'Electric Taser (Auto-Targets Chasing Anomalies)',
      icon: '⚡',
      color: 0xfacc15
    });
    this.showToast('⚡ Holding Taser! As long as you hold the Taser and can see a chasing anomaly, it will auto-target & zap it (10s reload)!');
    this.updateHUD();
  }

  isEntityVisibleOnScreen(worldPos, maxDist = 17.0) {
    if (!worldPos) return false;
    const dist = this.player.pos.distanceTo(worldPos);
    if (dist > maxDist) return false;
    const testPos = worldPos.clone().add(new THREE.Vector3(0, 1.0, 0));
    const proj = testPos.project(this.camera);
    return proj.z > 0 && proj.z < 1.0 && Math.abs(proj.x) <= 0.92 && Math.abs(proj.y) <= 0.92;
  }

  spawnTaserLightningBeam(targetWorldPos) {
    if (!targetWorldPos) return;
    const startPos = this.player.pos.clone().add(new THREE.Vector3(0, -0.18, 0));
    const endPos = targetWorldPos.clone().add(new THREE.Vector3(0, 1.0, 0));
    const midPos = startPos.clone().lerp(endPos, 0.5).add(
      new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.25, (Math.random() - 0.5) * 0.4)
    );
    const points = [startPos, midPos, endPos];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 4 });
    const bolt = new THREE.Line(geo, mat);
    this.scene.add(bolt);
    setTimeout(() => {
      this.scene.remove(bolt);
      geo.dispose();
      mat.dispose();
    }, 320);
  }

  equipStationGun() {
    if (this.currentShift < 9 && !this.hasInfiniteGun && this.currentShift !== 12) {
      this.showToast("Defense Gun Locker unlocks in Shift 9 (or earn Barney's Infinite Gun in Shift 6)!");
      return;
    }
    if (this.stationGunHolder && this.stationGunHolder !== this.playerNickname) {
      this.showToast(`Cannot take Gun: ${this.stationGunHolder} is already holding the station gun!`);
      return;
    }
    this.stationGunHolder = this.playerNickname;
    this.coop.broadcast('gun_taken', {});
    this.setHeldItem({
      id: 'station_gun',
      name: 'Hospital Defense Revolver',
      icon: '🔫',
      isWeapon: true
    });
    this.showToast('Equipped Defense Gun! Press [T] or Shoot button to eliminate anomalies.');
  }

  useWeaponOrTaser() {
    const hasGun =
      this.hasInfiniteGun || !!this.findHeldItem((it) => it.id === 'station_gun');

    if (this.findHeldItem((it) => it.id === 'fire_extinguisher')) {
      this.useFireExtinguisher();
      return;
    }

    if (!hasGun && !this.hasTaserEquipped) {
      this.showToast('Pick up the Taser from the Reception Display Box first!');
      return;
    }

    // Ensure the player is holding the Taser in hand when pressing Taser button
    if (!hasGun && !this.findHeldItem((it) => it.id === 'taser')) {
      this.setHeldItem({
        id: 'taser',
        name: 'Electric Taser (Auto-Targets Chasing Anomalies)',
        icon: '⚡',
        color: 0xfacc15
      });
    }

    if (!hasGun && this.taserCooldown > 0) {
      this.showToast(`Taser is reloading (${Math.ceil(this.taserCooldown)}s remaining)!`);
      return;
    }

    if (this.bossEntity && hasGun) {
      window.hospitalAudio.playGunshot();
      this.defeatShift12Boss();
      return;
    }

    const target = this.findTargetInCrosshair();
    if (!target) {
      this.showToast(
        hasGun
          ? 'holding Gun — Look at an anomaly and press [T] to shoot.'
          : '⚡ Holding Taser — Look at a chasing anomaly to auto-target & zap it (10s reload)!'
      );
      this.updateHUD();
      return;
    }

    if (target.type === 'slimebert') {
      this.showToast('Slimebert is IMMUNE to guns and tasers! Use the Fire Extinguisher or Cough Syrup!');
      return;
    }

    if (hasGun) {
      window.hospitalAudio.playGunshot();
    } else {
      window.hospitalAudio.playTaserZap();
      this.taserCooldown = 10; // 10 seconds Taser reload as requested!
    }

    if (target.entity && target.entity.mesh) {
      this.spawnTaserLightningBeam(target.entity.mesh.position);
    }

    if (target.type === 'camo_monster') {
      this.scene.remove(target.entity.mesh);
      this.environmentalAnomalies = this.environmentalAnomalies.filter((a) => a !== target.entity);
      this.showToast('⚡ Taser locked onto Camouflage Anomaly and neutralized it! (+20 🪙 / 10s reload)');
      this.shiftStats.anomaliesNeutralized++;
      this.playerContributionScore += 2;
      this.awardHospitalCoins(20);
      this.updateHUD();
      return;
    }

    if (target.type === 'patient') {
      const p = target.entity;
      if (p.assignedRoom && p.assignedRoom.deathRitualActive) {
        this.clearDeathRitual(p.assignedRoom, 'Tased patient free from Death Ritual!');
        return;
      }
      this.killPatientOrAnomaly(p, hasGun ? 'Shot by Gun' : 'Auto-Targeted by Taser');
    }
  }

  killPatientOrAnomaly(patient, method) {
    if (this.currentLobbyPatient === patient) {
      this.currentLobbyPatient = null;
    }
    if (patient.assignedRoom) {
      patient.assignedRoom.patient = null;
      patient.assignedRoom.lastPatientMesh = null;
      patient.assignedRoom.signMat.color.setHex(0x22c55e);
      patient.assignedRoom.signMat.emissive.setHex(0x064e3b);
      patient.assignedRoom = null;
    }

    const pMesh = patient.mesh;
    this.removeActivePatient(patient);

    if (patient.isAnomaly) {
      window.hospitalAudio.playAnomalyScreech();
      if (pMesh) {
        pMesh.userData.setVisualMode('awakened_red');
        pMesh.rotation.x = -Math.PI / 2;
        pMesh.position.y = 0.25;
        setTimeout(() => {
          this.scene.remove(pMesh);
        }, 1000);
      }
      this.shiftStats.anomaliesNeutralized++;
      this.playerContributionScore += 4;
      this.cash += 35;
      this.awardHospitalCoins(20);
      this.showToast(
        `⚡ Neutralized Anomaly ${patient.name} (${method})! (+20 🪙 Hospital Coins, 0 Strikes Lost!)`
      );
      setTimeout(() => {
        this.spawnNextLobbyPatient();
        this.checkShiftCompletion();
      }, 2000);
    } else {
      this.strikesRemaining--;
      this.shiftStats.deaths++;
      if (pMesh) {
        pMesh.rotation.x = -Math.PI / 2;
        pMesh.position.y = 0.25;
        setTimeout(() => {
          this.scene.remove(pMesh);
        }, 1200);
      }
      this.showToast(
        `❌ WARNING! ${patient.name} was a NORMAL patient (${method})! They fled the hospital! Strikes left: ${this.strikesRemaining}/3`
      );

      if (this.strikesRemaining <= 0) {
        this.triggerGameOver('You killed 3 Normal Animal Patients in a single shift — YOU ARE FIRED!');
        return;
      }
      setTimeout(() => {
        this.spawnNextLobbyPatient();
        this.checkShiftCompletion();
      }, 2000);
    }
    this.updateHUD();
  }

  removeActivePatient(patient) {
    this.activePatients = this.activePatients.filter((p) => p !== patient);
  }

  // ==========================================================================
  // ENVIRONMENTAL ANOMALIES: CEILING, UNDER-BED, CAMO, SLIMEBERT, DEATH RITUAL
  // ==========================================================================
  setupShiftEnvironmentalAnomalies(cfg) {
    this.ceilingMonsterActive = !!cfg.ceilingMonster;
    if (this.ceilingMonsterActive) {
      const massGroup = new THREE.Group();
      const fleshMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.2 });
      const base = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 12), fleshMat);
      base.scale.set(1.4, 0.35, 1.4);
      massGroup.add(base);

      for (let i = 0; i < 9; i++) {
        const eye = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        const angle = (i / 9) * Math.PI * 2;
        eye.position.set(Math.cos(angle) * 0.65, -0.25, Math.sin(angle) * 0.65);
        massGroup.add(eye);
      }
      massGroup.position.set(0, 4.1, 8.5);
      this.scene.add(massGroup);
      this.environmentalAnomalies.push({ type: 'ceiling_monster', mesh: massGroup });
    }

    if (cfg.camoMonster) {
      const camoGroup = new THREE.Group();
      const camoMat = new THREE.MeshStandardMaterial({
        color: 0x285e7a,
        roughness: 0.65
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.35), camoMat);
      body.position.y = 0.95;
      camoGroup.add(body);

      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfca5a5 });
      const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
      e1.position.set(-0.18, 1.35, 0.19);
      const e2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
      e2.position.set(0.18, 1.35, 0.19);
      camoGroup.add(e1, e2);

      camoGroup.position.set(-3.6, 0, -14.5);
      this.scene.add(camoGroup);
      this.environmentalAnomalies.push({
        type: 'camo_monster',
        mesh: camoGroup,
        pos: camoGroup.position
      });
    }

    if (cfg.deathRitualCount && cfg.deathRitualCount > 0) {
      setTimeout(() => {
        if (this.state === 'playing') {
          this.startDeathRitualInRoom(this.wardRooms[1]);
        }
      }, 9000);
    }
  }

  spawnSlimebert() {
    const mesh = window.HospitalModels.createSlimebertMesh();
    mesh.position.set(0, 0, -8.0);
    this.scene.add(mesh);
    this.environmentalAnomalies.push({
      type: 'slimebert',
      mesh,
      stunTimer: 0
    });
    this.showToast('🟢 SLIMEBERT HAS ENTERED THE HOSPITAL! Use Fire Extinguisher to stun or Cough Syrup to melt!');
  }

  startDeathRitualInRoom(room) {
    if (!room || room.deathRitualActive) return;
    room.deathRitualActive = true;
    room.ritualTimer = 36.0;

    const candleOffsets = [
      [-1.3, -0.9],
      [1.3, -0.9],
      [-1.3, 0.9],
      [1.3, 0.9]
    ];
    candleOffsets.forEach(([ox, oz]) => {
      const cGroup = new THREE.Group();
      const wax = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.45, 10),
        new THREE.MeshStandardMaterial({ color: 0xfef2f2 })
      );
      wax.position.y = 0.22;
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xf97316 })
      );
      flame.position.y = 0.5;
      cGroup.add(wax, flame);
      cGroup.position.set(room.pos.x + ox, 0, room.pos.z + oz);
      this.scene.add(cGroup);
      room.ritualCandles.push(cGroup);
    });

    this.showToast(
      `🕯️ DEATH RITUAL IN ROOM ${room.roomNumber}! Levitating patient surrounded by candles (36s)! Extinguish with [E], Eye Drops, or Taser!`
    );
    this.updateHUD();
  }

  extinguishDeathRitualCandle(room) {
    if (room.ritualCandles.length === 0) return;
    const candle = room.ritualCandles.pop();
    this.scene.remove(candle);

    if (this.findHeldItem((it) => it.id === 'eye_drops')) {
      this.showToast(`Used Eye Drops on Ritual Candle in Room ${room.roomNumber} (0 Sanity lost)!`);
    } else {
      this.modifySanity(-2, 'Extinguished Ritual Candle by Hand');
    }

    if (room.ritualCandles.length === 0) {
      this.clearDeathRitual(room, `All candles extinguished in Room ${room.roomNumber}! Death Ritual stopped!`);
    } else {
      this.showToast(`${room.ritualCandles.length} Ritual Candles remaining in Room ${room.roomNumber}!`);
    }
  }

  clearDeathRitual(room, msg) {
    room.deathRitualActive = false;
    room.ritualCandles.forEach((c) => this.scene.remove(c));
    room.ritualCandles = [];
    this.playerContributionScore += 3;
    this.showToast(msg);
    this.updateHUD();
  }

  // ==========================================================================
  // SHIFT 3, 4, 5, 6, 7, 10, & 12 SPECIAL STORY EVENTS
  // ==========================================================================
  triggerBarneyVisit(shiftNum) {
    if (this.state !== 'playing' || !this.barneyAccepted) return;

    if (shiftNum === 3) {
      this.showStoryModal(
        'Barney (Mysterious Visitor)',
        '“Hey there, Doctor friend! Could I trouble you for a cup of Milk? Also... could you hold onto my brown suitcase with this [DO NOT OPEN!] sticky note for a couple shifts?”',
        [
          {
            label: "Accept Barney's Suitcase & Give Milk",
            action: () => {
              this.barneyAccepted = true;
              this.cash += 25;
              this.showToast("You accepted Barney's [DO NOT OPEN!] suitcase. Barney will visit again!");
            }
          },
          {
            label: "Decline Barney (He won't return)",
            action: () => {
              this.barneyAccepted = false;
              this.showToast("You declined Barney. He walked out with his suitcase and won't return.");
            }
          }
        ]
      );
    } else if (shiftNum === 4) {
      this.showStoryModal(
        'Barney (Returns in Shift 4)',
        '“Hello again friend! Can I get another cup of Milk and a quick Polaroid photo of my handsome face for my collection?”',
        [
          {
            label: "Give Milk & Snap Barney's Photo (+$30)",
            action: () => {
              window.hospitalAudio.playCameraShutter();
              this.cash += 30;
              this.showToast('Barney: "Thanks friend! Keep my suitcase safe until Shift 5!"');
            }
          }
        ]
      );
    } else if (shiftNum === 5) {
      this.showStoryModal(
        'Barney (Shift 5 Suitcase Pickup)',
        '“Whoa, looks busy with that Ambulance rush! Just dropping by to pick up my [DO NOT OPEN!] suitcase. See you in Shift 6, friend!”',
        [{ label: 'Hand Back Suitcase', action: () => {} }]
      );
    }
  }

  triggerShift6BarneyPoliceChoice() {
    if (!this.barneyAccepted) {
      this.completeShiftSuccess();
      return;
    }
    this.showStoryModal(
      '🚨 POLICE OFFICER AT RECEPTION (Shift 6)',
      'Barney rushes into your office: “Hide me in the office, friend! Don\'t say it, friend... don\'t say it!”\n\nA Police Officer knocks on the counter: “Doctor, have you seen Barney? He\'s a wanted serial killer!”',
      [
        {
          label: 'Decline / Hide Barney ("Haven\'t seen him, Officer")',
          action: () => {
            this.hasInfiniteGun = true;
            this.showToast(
              '🔫 Barney: "Thanks friend, I have something to give you!" — Received INFINITE REVOLVER GUN [T]!'
            );
            this.completeShiftSuccess();
          }
        },
        {
          label: 'Tell Police ("He\'s hiding in the office!")',
          action: () => {
            window.hospitalAudio.playAnomalyScreech();
            this.barneyAccepted = false;
            this.showToast('Barney burst out, eliminated the police officer shouting "FRIEND BETRAYED BARNEY!" and left forever!');
            this.completeShiftSuccess();
          }
        }
      ]
    );
  }

  triggerShift5AmbulanceRush() {
    window.hospitalAudio.playAmbulanceSiren();
    this.hasWheelbed = true;
    this.showToast(
      '🚑 EMERGENCY AMBULANCE BARGED IN! 7 Normal Patients & 3 Anomalies fainted in front of Registration! Use the Wheelbed (+30s timer) and carry them [E] to Ward & Emergency rooms!'
    );

    const rushCount = Math.min(4, this.shiftQueue.length);
    for (let i = 0; i < rushCount; i++) {
      const pData = this.shiftQueue.shift();
      pData.fainted = true;
      const mesh = window.HospitalModels.createAnimalPatientMesh(pData);
      mesh.position.set(-3.0 + i * 2.0, 0.25, 3.8);
      mesh.rotation.x = -Math.PI / 2;
      this.scene.add(mesh);
      pData.mesh = mesh;

      if (i === 0) {
        const topER = this.emergencyRooms[1];
        topER.patient = pData;
        topER.timer = 60 + 30 + (this.selectedChar.emergencyBonusSec || 0);
        mesh.position.set(topER.pos.x, 0.75, topER.pos.z);
        this.activePatients.push(pData);
      } else {
        const freeRoom = this.wardRooms[i];
        this.assignPatientToWardRoom(pData, freeRoom);
      }
    }
    this.updateHUD();
  }

  interactWithSecretVault(posterMesh, vaultMesh) {
    if (!this.posterBroken) {
      this.posterBroken = true;
      posterMesh.visible = false;
      vaultMesh.visible = true;
      this.showToast("You tore down the Room 104 poster! A locked Wall Vault is hidden behind it (Needs Rathew's Key).");
      return;
    }

    if (!this.hasRathewKey) {
      this.showToast('The hidden Room 104 Vault is locked! Help Rathew in Shift 4 to receive the Vault Key.');
      return;
    }

    if (!this.hasRattinaPhoto) {
      this.hasRattinaPhoto = true;
      this.setHeldItem({
        id: 'rattina_photo',
        name: "Photo of Rattina (Rathew's Twin Sister)",
        icon: '🖼️'
      });
      this.showStoryModal(
        'Room 104 Secret Vault Unlocked!',
        "Inside the vault is an old photograph of Rathew's twin sister, Rattina. She looks just like Rathew, except she is wearing a bright pink ribbon on her head.",
        [{ label: 'Take Photo of Rattina', action: () => {} }]
      );
    } else {
      this.showToast("You already retrieved Rattina's Photo from the vault.");
    }
  }

  pickupManagerBox() {
    this.managerBoxMesh.visible = false;
    this.setHeldItem({
      id: 'manager_box',
      name: "Manager's Sealed Box",
      icon: '📦'
    });
    this.setObjectiveCompass(
      new THREE.Vector3(5.2, 1.5, -25.5),
      "Bring Sealed Box to Manager's Office Door [E]"
    );
    this.showToast("Picked up the Manager's Box! Carry it to the Manager's Office in the North-East corridor.");
  }

  interactWithManagersOffice() {
    if (this.currentShift === 12 && this.shift12Phase === 'none') {
      this.startShift12FinaleSequence();
      return;
    }

    if (this.currentShift < 6) {
      this.showToast("The Manager's Office is locked until Shift 6.");
      return;
    }

    if (!this.managerOfficeUnlocked) {
      const boxItem = this.findHeldItem((it) => it.id === 'manager_box');
      if (boxItem) {
        this.managerOfficeUnlocked = true;
        this.consumeSpecificHeldItem(boxItem);
        this.cash += 50;
        this.showStoryModal(
          "Manager's Office Unlocked — Animal Corporation Classified Files",
          'You delivered the box and unlocked the Manager\'s Office! Inside, secret dossiers reveal that Animal Hospital is a front for "Animal Corporation" bio-mimic experiments. Warning notes state:\n• Room 4\'s low-sanity cat mutated into the Under-Bed Monster.\n• Hungry anomalies will now try to eat recovering ward patients unless stopped within 16 seconds!',
          [{ label: 'Read Classified Files (+$50)', action: () => {} }]
        );
      } else {
        this.showToast("Bring the Manager's Sealed Box from Reception [E] to unlock the Manager's Office!");
      }
      return;
    }

    this.showToast("Manager's Office: Classified Animal Corporation files are spread across the desk.");
  }

  // ==========================================================================
  // SHIFT 12 GRAND FINALE: 10S GUN WARNING -> BOSS CHASE -> 3S FIRE -> DISCO!
  // ==========================================================================
  startShift12FinaleSequence() {
    this.shift12Phase = 'gun_countdown';
    this.shift12Timer = 10.0;

    const bossData = {
      name: 'Apex Manager-Eating Anomaly',
      species: { id: 'devil_cat', label: 'Apex Anomaly' },
      color: { hex: '#dc2626', num: 0xdc2626 }
    };
    const bossMesh = window.HospitalModels.createAnimalPatientMesh(bossData);
    bossMesh.userData.setVisualMode('awakened_red');
    bossMesh.scale.set(1.25, 1.25, 1.25);
    bossMesh.position.set(7.2, 0, -25.5);
    this.scene.add(bossMesh);
    this.bossEntity = { mesh: bossMesh, speed: 6.2 };

    this.hasInfiniteGun = true;
    this.showToast(
      "🩸 HORROR IN MANAGER'S OFFICE! An Anomaly is standing over the Manager in a pool of blood! HOLD YOUR GUN IMMEDIATELY (10 SECONDS)!"
    );
  }

  defeatShift12Boss() {
    if (!this.bossEntity) return;
    window.hospitalAudio.playAnomalyScreech();
    this.scene.remove(this.bossEntity.mesh);
    this.bossEntity = null;

    this.shift12Phase = 'fire_countdown';
    this.shift12Timer = 3.0;
    this.showToast('🔥 BOSS DEFEATED! 3 SECONDS WARNING: EQUIP FIRE EXTINGUISHER IMMEDIATELY!');
  }

  igniteHospitalFire() {
    this.shift12Phase = 'extinguish_fire';
    this.clearShiftEntities();
    this.pickupFireExtinguisher();

    const fireLocations = [
      [0, -4],
      [-2.5, -10],
      [2.5, -16],
      [0, -22]
    ];
    this.fireNodes = [];
    fireLocations.forEach(([fx, fz]) => {
      const fMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.85, 2.2, 12),
        new THREE.MeshBasicMaterial({ color: 0xf97316 })
      );
      fMesh.position.set(fx, 1.1, fz);
      this.scene.add(fMesh);
      this.fireNodes.push(fMesh);
    });

    this.showToast('🔥 FIRE SPREAD ACROSS THE HOSPITAL! Press [T] or [E] with Fire Extinguisher near the flames to put them out!');
  }

  startGrandDiscoCelebration() {
    this.shift12Phase = 'disco';
    this.isDiscoFinale = true;
    document.getElementById('big-countdown-banner').style.display = 'none';
    document.getElementById('disco-banner').style.display = 'flex';
    this.discoBallMesh.visible = true;
    window.hospitalAudio.startDiscoMusic();

    this.blackoutActive = false;
    this.ceilingLights.forEach((l, i) => {
      const partyColors = [0xec4899, 0x38bdf8, 0x4ade80, 0xfacc15, 0xa855f7, 0xf97316];
      l.color.setHex(partyColors[i % partyColors.length]);
      l.intensity = 2.2;
    });

    const castNames = [
      { name: 'Hospital Manager', species: 'bear', color: '#38bdf8' },
      { name: 'Barney (Friend)', species: 'dog', color: '#fbbf24' },
      { name: 'Rathew', species: 'bear', color: '#1e242b', specialType: 'rathew' },
      { name: 'Rattina', species: 'rabbit', color: '#c084fc', hasRibbon: true },
      { name: 'Liz (UV Researcher)', species: 'cat', color: '#a855f7' },
      { name: 'Police Officer', species: 'dog', color: '#60a5fa' },
      { name: 'Ambulance Driver', species: 'rabbit', color: '#4ade80' },
      { name: 'Friendly Anomaly', species: 'devil_cat', color: '#f9a8d4' },
      { name: 'Slimebert', specialType: 'slimebert' }
    ];

    this.discoDancers = [];
    castNames.forEach((c, idx) => {
      const angle = (idx / castNames.length) * Math.PI * 2;
      const mesh = window.HospitalModels.createAnimalPatientMesh({
        name: c.name,
        species: { id: c.species || 'rabbit' },
        color: { hex: c.color || '#f9a8d4', num: parseInt((c.color || '#f9a8d4').replace('#', '0x'), 16) },
        specialType: c.specialType,
        hasRibbon: c.hasRibbon
      });
      mesh.position.set(Math.cos(angle) * 4.2, 0, 9.5 + Math.sin(angle) * 2.8);
      this.scene.add(mesh);
      this.discoDancers.push(mesh);
    });

    this.player.pos.set(0, 1.68, 12.2);
    this.player.yaw = 0;
    this.awardHospitalCoins(100);
    this.showToast('🎉 CONGRATULATIONS! YOU COMPLETED ALL 12 SHIFTS OF ANOMALY HOSPITAL! (+100 🪙 Hospital Coins!)');
  }

  // ==========================================================================
  // OTHER TOOLS & 2-ITEM INVENTORY MANAGEMENT
  // ==========================================================================
  setHeldItem(item) {
    const maxCap = this.selectedChar.carryCapacity || 1;
    if (item === null) {
      this.heldItem = this.secondaryHeldItem;
      this.secondaryHeldItem = null;
    } else if (maxCap >= 2 && this.heldItem && !this.secondaryHeldItem) {
      this.secondaryHeldItem = item;
    } else {
      this.heldItem = item;
    }
    this.refreshFPHandMesh();
    this.updateHUD();
  }

  findHeldItem(predicate) {
    if (this.heldItem && predicate(this.heldItem)) return this.heldItem;
    if (this.secondaryHeldItem && predicate(this.secondaryHeldItem)) return this.secondaryHeldItem;
    return null;
  }

  getHeldMedicines() {
    const list = [];
    if (this.heldItem && this.heldItem.isMedicine) list.push(this.heldItem);
    if (this.secondaryHeldItem && this.secondaryHeldItem.isMedicine) list.push(this.secondaryHeldItem);
    return list;
  }

  consumeSpecificHeldItem(targetItem) {
    if (this.secondaryHeldItem === targetItem) {
      this.secondaryHeldItem = null;
    } else if (this.heldItem === targetItem) {
      this.heldItem = this.secondaryHeldItem;
      this.secondaryHeldItem = null;
    }
    this.refreshFPHandMesh();
    this.updateHUD();
  }

  consumeHeldItemById(idsArray) {
    if (this.secondaryHeldItem && idsArray.includes(this.secondaryHeldItem.id)) {
      this.secondaryHeldItem = null;
    } else if (this.heldItem && idsArray.includes(this.heldItem.id)) {
      this.heldItem = this.secondaryHeldItem;
      this.secondaryHeldItem = null;
    }
    this.refreshFPHandMesh();
    this.updateHUD();
  }

  refreshFPHandMesh() {
    while (this.fpHandGroup.children.length > 0) {
      this.fpHandGroup.remove(this.fpHandGroup.children[0]);
    }
    if (this.heldItem) {
      let mesh;
      if (this.heldItem.id === 'patient_id_tag' && this.heldItem.patient) {
        mesh = window.HospitalModels.create3DPatientIDCard(this.heldItem.patient.name);
        mesh.rotation.x = Math.PI / 3;
      } else {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.22, 0.18),
          new THREE.MeshStandardMaterial({ color: this.heldItem.color || 0x38bdf8 })
        );
      }
      this.fpHandGroup.add(mesh);
    }
  }

  pickupMedicine(med) {
    window.hospitalAudio.playUIButton();
    this.setHeldItem({
      id: med.id,
      name: med.name,
      icon: med.icon,
      color: med.color,
      isMedicine: true
    });

    if (med.id === 'eye_drops' && this.ceilingMonsterActive) {
      this.showToast('Picked up Eye Drops! You can use them on a bedded patient, Ritual Candles, or press [E] to calm the Ceiling Monster.');
    } else {
      this.showToast(`Picked up ${med.icon} ${med.name} (${med.symptom}).`);
    }
  }

  pickupFireExtinguisher() {
    if (this.currentShift < 3 && this.currentShift !== 12) {
      this.showToast('Fire Extinguisher is available for free starting at Shift 3!');
      return;
    }
    window.hospitalAudio.playUIButton();
    this.setHeldItem({
      id: 'fire_extinguisher',
      name: 'Fire Extinguisher',
      icon: '🧯'
    });
    this.showToast('Equipped Fire Extinguisher! Press [T] or Shoot button to spray Slimebert, Camo Monsters, or Fires.');
  }

  useFireExtinguisher() {
    window.hospitalAudio.playExtinguisherSpray();

    if (this.shift12Phase === 'extinguish_fire' && this.fireNodes) {
      if (this.fireNodes.length > 0) {
        const f = this.fireNodes.pop();
        this.scene.remove(f);
        this.showToast(`Extinguished flame! (${this.fireNodes.length} fires left)`);
        if (this.fireNodes.length === 0) {
          this.startGrandDiscoCelebration();
        }
        return;
      }
    }

    const slime = this.environmentalAnomalies.find((a) => a.type === 'slimebert');
    if (slime) {
      slime.stunTimer = 45.0;
      this.showToast('🧯 Sprayed Slimebert! Slimebert: "COLD… Bubbles… Rude…" (Stunned for 45 seconds!)');
      this.playerContributionScore += 2;
      return;
    }

    const camo = this.environmentalAnomalies.find((a) => a.type === 'camo_monster');
    if (camo && camo.mesh.position.distanceTo(this.player.pos) < 8.0) {
      this.scene.remove(camo.mesh);
      this.environmentalAnomalies = this.environmentalAnomalies.filter((a) => a !== camo);
      this.showToast('🧯 Sprayed Camouflage Wall Anomaly! It dissolved away. (+20 🪙)');
      this.shiftStats.anomaliesNeutralized++;
      this.playerContributionScore += 2;
      this.awardHospitalCoins(20);
      return;
    }

    this.showToast('Sprayed Fire Extinguisher foam.');
  }

  toggleFlashlight() {
    window.hospitalAudio.playUIButton();
    this.flashlightOn = !this.flashlightOn;
    this.flashlight.intensity = this.flashlightOn ? 3.2 : 0;
    document.getElementById('act-flashlight').classList.toggle('active-toggle', this.flashlightOn);
  }

  toggleUVLight() {
    if (!this.hasUVCamera) {
      this.showToast('UV Camera unlocks for free from Liz in Shift 10 (or buy early in Supplies Shop)!');
      return;
    }
    window.hospitalAudio.playUIButton();
    this.uvModeActive = !this.uvModeActive;
    document.getElementById('uv-overlay').style.display = this.uvModeActive ? 'block' : 'none';
    document.getElementById('act-uv').classList.toggle('active-toggle', this.uvModeActive);

    if (this.currentLobbyPatient && this.currentLobbyPatient.mesh) {
      if (this.uvModeActive && this.currentLobbyPatient.anomalyDetectionType === 'uv') {
        this.currentLobbyPatient.mesh.userData.setVisualMode('uv_reveal');
        this.showToast('🔮 UV CAMERA REVEALED GLOWING BIOLUMINESCENT INFECTION ON PATIENT FACE!');
      } else {
        this.currentLobbyPatient.mesh.userData.setVisualMode('normal');
      }
    }
  }

  setRunningState(running) {
    this.isRunning = running;
    document.getElementById('act-run').classList.toggle('active-toggle', this.isRunning);
  }

  toggleHidingSpot() {
    this.isHiding = !this.isHiding;
    if (this.isHiding) {
      this.player.pos.set(-9.5, 1.68, 13.4);
      this.showToast('Hiding inside Safe Locker! Anomalies cannot harm you while inside, but they will wait outside.');
    } else {
      this.player.pos.set(-8.0, 1.68, 12.2);
      this.showToast('Stepped out of Hiding Locker.');
    }
  }

  useTrashCan() {
    if (this.heldItem) {
      const droppedName = this.heldItem.name;
      if (this.heldItem.id === 'carried_patient' && this.heldItem.patient) {
        const p = this.heldItem.patient;
        if (p.mesh) this.scene.remove(p.mesh);
        this.removeActivePatient(p);
        if (this.currentLobbyPatient === p) this.currentLobbyPatient = null;
        setTimeout(() => this.spawnNextLobbyPatient(), 1800);
      }
      this.consumeSpecificHeldItem(this.heldItem);
      this.showToast(`Disposed of ${droppedName} in the Hospital Trash Can.`);
    } else if (this.currentLobbyPatient && this.currentLobbyPatient.fainted) {
      const p = this.currentLobbyPatient;
      this.setHeldItem({
        id: 'carried_patient',
        name: `Fainted Patient: ${p.name}`,
        icon: '🐾',
        patient: p
      });
      this.showToast(`Carrying fainted ${p.name}! Take them to a Ward Bed or throw in Trash Can.`);
    } else {
      this.showToast('Trash Can: Hold an unwanted item or fainted body and press [E] to throw it away.');
    }
  }

  equipWheelbed() {
    if (this.currentShift < 3) {
      this.showToast('Wheelchair / Wheelbed unlocks starting at Shift 3!');
      return;
    }
    this.hasWheelbed = true;
    this.permanentSpeedBoost = Math.max(this.permanentSpeedBoost, 1.25);
    this.showToast('Equipped Hospital Wheelchair / Wheelbed! Movement speed boosted & Emergency Room timers gain +30s!');
  }

  repairCCTV(location) {
    this.cctvBroken[location] = false;
    window.hospitalAudio.playUIButton();
    this.playerContributionScore += 2;
    this.showToast(`🔧 Repaired ${location.toUpperCase()} CCTV Camera! Feed restored.`);
  }

  flipFuseBox() {
    window.hospitalAudio.playUIButton();
    this.blackoutActive = false;
    this.updateHospitalLighting();

    let triggeredGag = false;
    const allP = [...this.activePatients];
    if (this.currentLobbyPatient) allP.push(this.currentLobbyPatient);
    allP.forEach((p) => {
      if (p.species?.canLightBulbGag && p.mesh) {
        p.mesh.userData.setVisualMode('lightbulb_gag');
        triggeredGag = true;
        setTimeout(() => {
          if (p.mesh) p.mesh.userData.setVisualMode('normal');
        }, 4000);
      }
    });

    if (triggeredGag) {
      this.showToast("💡 FUSE BOX RESTORED! Easter Egg: The Bear/Sheep patient's head lit up like a glowing lamp!");
    } else {
      this.showToast('💡 Fuse Box breaker flipped! Hospital ceiling lights restored to full brightness.');
    }
  }

  interactWithEmergencyRoom(erObj) {
    if (!erObj.patient) {
      const carried = this.findHeldItem((it) => it.id === 'carried_patient');
      if (carried) {
        erObj.patient = carried.patient;
        erObj.timer = 60 + (this.hasWheelbed ? 30 : 0) + (this.selectedChar.emergencyBonusSec || 0);
        this.consumeSpecificHeldItem(carried);
        this.showToast(`Placed patient in ${erObj.name}! Timer: ${erObj.timer}s.`);
      } else {
        this.showToast(`${erObj.name} has no patient right now.`);
      }
      return;
    }

    const heldMed = this.findHeldItem((it) => it.isMedicine);
    if (heldMed) {
      window.hospitalAudio.playUIButton();
      this.consumeSpecificHeldItem(heldMed);
      this.showToast(`🎉 Emergency Surgery Completed in ${erObj.name}! Patient saved (+$50 & +20 🪙)!`);
      if (erObj.patient.mesh) this.scene.remove(erObj.patient.mesh);
      this.removeActivePatient(erObj.patient);
      erObj.patient = null;
      this.cash += 50;
      this.awardHospitalCoins(20);
      this.shiftStats.recovered++;
      this.playerContributionScore += 4;
      this.checkShiftCompletion();
      this.updateHUD();
    } else {
      this.showToast('Pick up an Emergency Surgery item from the tables inside the Top Emergency Room first!');
    }
  }

  openShopModal() {
    const modal = document.getElementById('shop-modal');
    const list = document.getElementById('shop-items-list');
    list.innerHTML = '';

    window.GAME_DATA.shopItems.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'char-card';
      row.innerHTML = `
        <div class="char-card-header">
          <span class="char-card-title">${item.icon} ${item.name}</span>
          <span style="color:#4ade80;font-weight:900;">$${item.cost}</span>
        </div>
        <div class="char-card-lore">${item.desc}</div>
      `;
      row.onclick = () => this.buyShopItem(item);
      list.appendChild(row);
    });

    modal.style.display = 'flex';
  }

  buyShopItem(item) {
    if (this.cash < item.cost) {
      this.showToast(`Not enough Hospital Cash! Need $${item.cost} (You have $${this.cash}).`);
      return;
    }
    this.cash -= item.cost;
    window.hospitalAudio.playUIButton();

    if (item.id === 'scanner') {
      this.setHeldItem({ id: 'scanner', name: 'Medical DNA Scanner', icon: '📟' });
      if (this.currentLobbyPatient?.specialType === 'rattina_stalker') {
        this.showToast('📟 SCANNER BEAM TURNED PURPLE: [ ??? ] — CORRUPTED STALKER ENTITY!');
      } else {
        this.showToast('Equipped Medical DNA Scanner!');
      }
    } else if (item.id === 'coffee') {
      this.modifySanity(20, 'Hot Coffee');
      this.showToast('Drank Hot Coffee (+20% Sanity)!');
    } else if (item.id === 'chocolate') {
      this.modifySanity(15, 'Chocolate Bar');
      this.showToast('Ate Chocolate Bar (+15% Sanity)!');
    } else if (item.id === 'cola') {
      this.permanentSpeedBoost = 1.35;
      this.showToast('Drank Run Fast Cola! Sprint & walk speed boosted!');
    } else if (item.id === 'uv_camera') {
      this.hasUVCamera = true;
      this.showToast('Unlocked UV Camera [U]!');
    } else if (item.id === 'sam_helper') {
      this.samHired = true;
      this.showToast('🧑‍🚀 Hired Sam (Hazmat Helper)! Sam will automatically clean Slimebert and protect patients!');
    }
    this.updateHUD();
    document.getElementById('shop-modal').style.display = 'none';
  }

  // ==========================================================================
  // SHIFT COMPLETION, MVP SUMMARY, & NEXT SHIFT PROGRESSION
  // ==========================================================================
  checkShiftCompletion() {
    if (this.state !== 'playing' || this.isDiscoFinale) return;
    if (this.shiftQueue.length > 0 || this.currentLobbyPatient || this.activePatients.length > 0) {
      return;
    }

    if (this.currentShift === 6 && !this.shift6PoliceDone) {
      this.shift6PoliceDone = true;
      this.triggerShift6BarneyPoliceChoice();
      return;
    }

    if (this.currentShift === 12 && this.shift12Phase === 'none') {
      this.setObjectiveCompass(
        new THREE.Vector3(5.2, 1.5, -25.5),
        "Investigate Blood on Manager's Office Door [E]"
      );
      this.showToast("All Shift 12 patients handled! Now investigate the bloody Manager's Office door!");
      return;
    }

    this.completeShiftSuccess();
  }

  completeShiftSuccess() {
    if (document.pointerLockElement) document.exitPointerLock();
    this.awardHospitalCoins(40);

    const modal = document.getElementById('summary-modal');
    const body = document.getElementById('summary-content');

    let mvpName = `${this.playerNickname} (Score: ${this.playerContributionScore})`;
    for (const peer of this.coop.peers.values()) {
      if ((peer.score || 0) > this.playerContributionScore) {
        mvpName = `${peer.nickname} (Score: ${peer.score})`;
      }
    }

    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;">
        <div class="menu-section">
          <div>✅ <strong>Patients Recovered:</strong> ${this.shiftStats.recovered}</div>
          <div>🚪 <strong>Patients Declined:</strong> ${this.shiftStats.declined}</div>
          <div>⚡ <strong>Anomalies Neutralized:</strong> ${this.shiftStats.anomaliesNeutralized}</div>
          <div>💀 <strong>Normal Patient Deaths:</strong> ${this.shiftStats.deaths} / 3</div>
          <div style="margin-top:6px;color:#fde047;font-weight:800;">🪙 Shift Bonus: +40 Hospital Coins (Total: ${this.hospitalCoins} 🪙)</div>
        </div>
        <div class="menu-section">
          <div style="color:#fbbf24;font-weight:800;margin-bottom:6px;">🏆 SHIFT MVP (WORKED MOST):</div>
          <div style="font-size:1.1rem;font-weight:900;color:#4ade80;">${mvpName}</div>
          <div style="margin-top:8px;font-size:0.82rem;color:#cbd5e1;">Patient Safety Strikes reset back to 3/3 for the next shift!</div>
        </div>
      </div>
    `;

    const nextBtn = document.getElementById('btn-next-shift');
    const nextShiftNum = Math.min(12, this.currentShift + 1);
    nextBtn.textContent = `Proceed to Shift ${nextShiftNum} →`;
    nextBtn.onclick = () => {
      modal.style.display = 'none';
      this.beginShift(nextShiftNum);
    };

    modal.style.display = 'flex';
  }

  triggerGameOver(reason) {
    if (document.pointerLockElement) document.exitPointerLock();
    this.state = 'gameover';
    this.showStoryModal(
      '💀 GAME OVER — SHIFT TERMINATED',
      `${reason}\n\nRemember: Returning to the Main Menu restarts your career from Shift 1.`,
      [
        {
          label: 'Return to Main Menu (Restart at Shift 1)',
          action: () => this.exitToMainMenu()
        }
      ]
    );
  }

  triggerNearestInteract() {
    if (this.underBedGrabState) {
      this.underBedGrabState.struggleCount = (this.underBedGrabState.struggleCount || 0) + 1;
      if (this.underBedGrabState.struggleCount >= 3) {
        const rm = this.underBedGrabState.room;
        rm.hasBedMonster = false;
        rm.bedMonsterZone.visible = false;
        this.underBedGrabState = null;
        this.showToast('You hit the Under-Bed Monster and broke free from its grip!');
      } else {
        this.showToast('Struggling against Under-Bed Monster! Press [E] again to break free!');
      }
      return;
    }

    const rattinaPhotoItem = this.findHeldItem((it) => it.id === 'rattina_photo');
    if (
      this.currentLobbyPatient &&
      this.currentLobbyPatient.specialType === 'rattina_stalker' &&
      rattinaPhotoItem
    ) {
      this.consumeSpecificHeldItem(rattinaPhotoItem);
      this.scene.remove(this.currentLobbyPatient.mesh);
      this.currentLobbyPatient = null;
      this.awardHospitalCoins(25);
      this.showToast('🔥 "the photo burns in your hands..." — Rattina vanished into thin air! (+25 🪙)');
      setTimeout(() => this.spawnNextLobbyPatient(), 2000);
      return;
    }

    const coughSyrupItem = this.findHeldItem((it) => it.id === 'cough_syrup');
    if (coughSyrupItem) {
      const slime = this.environmentalAnomalies.find((a) => a.type === 'slimebert');
      if (slime && slime.mesh.position.distanceTo(this.player.pos) < 5.5) {
        this.scene.remove(slime.mesh);
        this.environmentalAnomalies = this.environmentalAnomalies.filter((a) => a !== slime);
        this.consumeSpecificHeldItem(coughSyrupItem);
        this.awardHospitalCoins(25);
        this.showToast('🍯 Fed Cough Syrup to Slimebert! It choked and melted away completely! (+25 🪙)');
        this.shiftStats.anomaliesNeutralized++;
        return;
      }
    }

    const eyeDropsItem = this.findHeldItem((it) => it.id === 'eye_drops');
    if (eyeDropsItem && this.ceilingMonsterActive) {
      const ceil = this.environmentalAnomalies.find((a) => a.type === 'ceiling_monster');
      if (ceil && ceil.mesh.position.distanceTo(this.player.pos) < 7.5) {
        this.scene.remove(ceil.mesh);
        this.environmentalAnomalies = this.environmentalAnomalies.filter((a) => a !== ceil);
        this.ceilingMonsterActive = false;
        this.consumeSpecificHeldItem(eyeDropsItem);
        document.getElementById('dont-look-up-warning').style.opacity = '0';
        this.showToast('👁️ Used Eye Drops on the "Don\'t Look Up" Ceiling Monster! It dissolved peacefully.');
        return;
      }
    }

    const idTagItem = this.findHeldItem((it) => it.id === 'patient_id_tag');
    if (
      idTagItem &&
      this.currentLobbyPatient &&
      this.player.pos.distanceTo(this.currentLobbyPatient.mesh.position) < 4.2
    ) {
      const freeRoom = this.wardRooms.find((r) => !r.patient);
      if (freeRoom) {
        this.assignPatientToWardRoom(this.currentLobbyPatient, freeRoom);
        return;
      }
    }

    const nearest = this.findNearestInteractable();
    if (nearest) {
      nearest.action();
    }
  }

  findNearestInteractable() {
    let best = null;
    let bestDist = 3.9;
    for (const item of this.interactables) {
      if (item.isVisibleFn && !item.isVisibleFn()) continue;
      const d = this.player.pos.distanceTo(item.pos);
      if (d < bestDist) {
        bestDist = d;
        best = item;
      }
    }
    return best;
  }

  findClosestActivePatient() {
    let best = null;
    let bestDist = 8.0;
    for (const p of this.activePatients) {
      if (p.mesh) {
        const d = this.player.pos.distanceTo(p.mesh.position);
        if (d < bestDist) {
          bestDist = d;
          best = p;
        }
      }
    }
    return best;
  }

  findTargetInCrosshair() {
    // 1. Prioritize any Chasing or Awakened Anomaly visible on screen!
    for (const p of this.activePatients) {
      if (
        p.mesh &&
        (p.state === 'chasing' || p.state === 'awakening_pause') &&
        this.isEntityVisibleOnScreen(p.mesh.position, 18.0)
      ) {
        return { type: 'patient', entity: p };
      }
    }
    // 2. Check environmental anomalies visible on screen
    for (const a of this.environmentalAnomalies) {
      if (a.mesh && this.isEntityVisibleOnScreen(a.mesh.position, 15.0)) {
        return { type: a.type, entity: a };
      }
    }
    // 3. Check any other active patient visible on screen
    for (const p of this.activePatients) {
      if (p.mesh && this.isEntityVisibleOnScreen(p.mesh.position, 14.0)) {
        return { type: 'patient', entity: p };
      }
    }
    // 4. Check lobby patient visible on screen
    if (
      this.currentLobbyPatient &&
      this.currentLobbyPatient.mesh &&
      this.isEntityVisibleOnScreen(this.currentLobbyPatient.mesh.position, 14.0)
    ) {
      return { type: 'patient', entity: this.currentLobbyPatient };
    }
    return null;
  }

  triggerFlickerHazard() {
    this.flickerTimer = 6.5;
    window.hospitalAudio.playFlickerBuzz();
  }

  updateHospitalLighting() {
    this.ceilingLights.forEach((l) => {
      l.color.setHex(0xe0f2fe);
      l.intensity = this.blackoutActive ? 0.08 : 1.15;
    });
    this.ambientLight.intensity = this.blackoutActive ? 0.18 : 0.72;
  }

  setObjectiveCompass(pos, label) {
    this.compassTargetPos.copy(pos);
    this.compassTargetLabel = label;
    document.getElementById('compass-target-name').textContent = label;
  }

  showToast(msg) {
    const dutyEl = document.getElementById('current-duty-text');
    if (dutyEl) dutyEl.textContent = msg;
  }

  showStoryModal(title, text, buttons = []) {
    const modal = document.getElementById('story-modal');
    document.getElementById('story-modal-title').textContent = title;
    document.getElementById('story-modal-body').innerText = text;
    const btnRow = document.getElementById('story-modal-buttons');
    btnRow.innerHTML = '';

    buttons.forEach((b) => {
      const btn = document.createElement('button');
      btn.className = 'primary-btn';
      btn.textContent = b.label;
      btn.onclick = () => {
        window.hospitalAudio.playUIButton();
        modal.style.display = 'none';
        if (b.action) b.action();
      };
      btnRow.appendChild(btn);
    });

    modal.style.display = 'flex';
  }

  updateHUD() {
    const cfg = window.GAME_DATA.shifts[this.currentShift - 1] || window.GAME_DATA.shifts[0];
    document.getElementById('shift-badge').textContent = `SHIFT ${this.currentShift} / 12`;
    document.getElementById('difficulty-badge').textContent = cfg.difficulty;

    const strikesHtml = [];
    for (let i = 0; i < 3; i++) {
      const lost = i >= this.strikesRemaining;
      strikesHtml.push(`<span class="strike-icon ${lost ? 'lost' : ''}"></span>`);
    }
    document.getElementById('strikes-icons').innerHTML = strikesHtml.join('');

    const h1 = document.getElementById('heart-1-badge');
    const h2 = document.getElementById('heart-2-badge');
    if (this.gameMode === 'coop') {
      h2.style.display = 'none';
      h1.textContent = `${Math.round(this.sanity)}%`;
      h1.className = 'heart-badge active-heart';
    } else {
      h2.style.display = 'flex';
      if (this.heartIndex === 1) {
        h1.textContent = `${Math.round(this.sanity)}%`;
        h1.className = 'heart-badge active-heart';
        h2.textContent = '100%';
        h2.className = 'heart-badge';
      } else {
        h1.textContent = '0%';
        h1.className = 'heart-badge depleted';
        h2.textContent = `${Math.round(this.sanity)}%`;
        h2.className = 'heart-badge active-heart';
      }
    }

    const barFill = document.getElementById('sanity-bar-fill');
    barFill.style.width = `${this.sanity}%`;
    barFill.style.background =
      this.sanity > 50 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#ef4444,#f97316)';

    document.getElementById('cash-display').textContent = `$${this.cash}`;

    const milkTag = document.getElementById('milk-cd-tag');
    milkTag.textContent = this.milkCooldown > 0 ? `🥛 Milk: ${Math.ceil(this.milkCooldown)}s` : '🥛 Milk: Ready';
    milkTag.className = 'cd-tag ' + (this.milkCooldown > 0 ? 'cooling' : 'ready');

    const taserTag = document.getElementById('taser-cd-tag');
    if (this.hasInfiniteGun) {
      taserTag.textContent = '🔫 Gun: ∞ Ready';
      taserTag.className = 'cd-tag ready';
    } else {
      taserTag.textContent =
        this.taserCooldown > 0 ? `⚡ Taser: ${Math.ceil(this.taserCooldown)}s` : '⚡ Taser: Ready';
      taserTag.className = 'cd-tag ' + (this.taserCooldown > 0 ? 'cooling' : 'ready');
    }

    document.getElementById('held-item-icon').textContent = this.heldItem ? this.heldItem.icon : '✋';
    if (this.heldItem && this.secondaryHeldItem) {
      document.getElementById('held-item-name').textContent = `${this.heldItem.name} + ${this.secondaryHeldItem.icon} ${this.secondaryHeldItem.name}`;
    } else {
      document.getElementById('held-item-name').textContent = this.heldItem
        ? this.heldItem.name
        : 'Empty Hands';
    }

    const listEl = document.getElementById('active-patients-list');
    const cards = [];

    if (this.currentLobbyPatient) {
      cards.push(`
        <div class="patient-task-card">
          <strong>Lobby: ${this.currentLobbyPatient.name}</strong><br/>
          <span>${this.currentLobbyPatient.tagPrinted ? '🪪 ID Tag Printed — Assign to Bed' : '📸 Take Photo & Print Tag on PC'}</span>
        </div>
      `);
    }

    this.activePatients.forEach((p) => {
      const rmNum = p.assignedRoom ? `Room ${p.assignedRoom.roomNumber}` : 'Corridor';
      if (p.state === 'recovering') {
        cards.push(`
          <div class="patient-task-card">
            <strong>${rmNum}: ${p.name}</strong><br/>
            <span style="color:#4ade80;">⏳ Recovering (${Math.ceil(p.recoveryTimer)}s)...</span>
          </div>
        `);
      } else if (p.state === 'chasing' || p.state === 'awakening_pause') {
        cards.push(`
          <div class="patient-task-card emergency">
            <strong>⚠️ ANOMALY: ${p.name}</strong><br/>
            <span>"I'M HUNGRY!" — Tase/Shoot [T] now!</span>
          </div>
        `);
      } else {
        const meds = p.requiredMeds
          .filter((m) => !m.given)
          .map((m) => `${m.icon} ${m.name}`)
          .join(', ');
        cards.push(`
          <div class="patient-task-card">
            <strong>${rmNum}: ${p.name}</strong><br/>
            <span>Needs: ${meds}</span>
          </div>
        `);
      }
    });

    this.emergencyRooms.forEach((er) => {
      if (er.patient) {
        cards.push(`
          <div class="patient-task-card emergency">
            <strong>🚨 ${er.name} (${Math.ceil(er.timer)}s)</strong><br/>
            <span>Give Emergency Surgery Item from ER Table!</span>
          </div>
        `);
      }
    });

    listEl.innerHTML = cards.join('');
  }

  // ==========================================================================
  // MAIN GAME LOOP (Movement, AI, Recovered Patient Exit & Despawn, Timers)
  // ==========================================================================
  animate(now) {
    requestAnimationFrame((t) => this.animate(t));
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.state === 'playing' && !this.isPaused) {
      this.updateGameplay(dt);
    }

    this.coop.update(dt);
    this.updateCameraAndSigns();
    this.renderer.render(this.scene, this.camera);
  }

  updateGameplay(dt) {
    if (this.milkCooldown > 0) {
      this.milkCooldown = Math.max(0, this.milkCooldown - dt);
    }
    if (this.taserCooldown > 0) {
      this.taserCooldown = Math.max(0, this.taserCooldown - dt);
    }

    // Animate recovered normal patients walking out & disappearing cleanly so they NEVER stack up!
    for (let i = this.walkingOutPatients.length - 1; i >= 0; i--) {
      const wp = this.walkingOutPatients[i];
      wp.leaveTimer -= dt;
      if (wp.mesh) {
        // Walk toward corridor exit (+Z)
        wp.mesh.position.z += 4.5 * dt;
        wp.mesh.rotation.y = 0;
      }
      if (wp.leaveTimer <= 0) {
        if (wp.mesh) {
          this.scene.remove(wp.mesh);
          wp.mesh = null;
        }
        this.walkingOutPatients.splice(i, 1);
      }
    }

    if (!this.isDowned && !this.isHiding && !this.underBedGrabState) {
      let forward = 0;
      let strafe = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) strafe += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) strafe -= 1;

      forward += this.touchMove.y;
      strafe += this.touchMove.x;

      if (this.keys['KeyQ']) this.rotateCamera(1.8 * dt, 0);

      const len = Math.hypot(forward, strafe);
      if (len > 0.01) {
        const normF = forward / Math.max(1, len);
        const normS = strafe / Math.max(1, len);
        const baseSpeed = 5.4 * this.permanentSpeedBoost;
        const speed = this.isRunning ? baseSpeed * 1.5 : baseSpeed;

        const sinY = Math.sin(this.player.yaw);
        const cosY = Math.cos(this.player.yaw);
        const moveX = (-sinY * normF + cosY * normS) * speed * dt;
        const moveZ = (-cosY * normF - sinY * normS) * speed * dt;

        this.player.pos.x = Math.max(-12.0, Math.min(12.0, this.player.pos.x + moveX));
        this.player.pos.z = Math.max(-36.2, Math.min(14.2, this.player.pos.z + moveZ));
      }
    }

    if (this.flickerTimer > 0) {
      this.flickerTimer -= dt;
      const flickerVal = Math.random() < 0.5 ? 0.2 : 0.45;
      this.ceilingLights.forEach((l) => {
        l.intensity = flickerVal;
      });
      if (this.flickerTimer <= 0) {
        this.updateHospitalLighting();
      }
    }

    const warnEl = document.getElementById('dont-look-up-warning');
    if (this.ceilingMonsterActive && !this.isDiscoFinale) {
      const ceil = this.environmentalAnomalies.find((a) => a.type === 'ceiling_monster');
      if (ceil) {
        const dist2D = Math.hypot(
          this.player.pos.x - ceil.mesh.position.x,
          this.player.pos.z - ceil.mesh.position.z
        );
        if (dist2D < 9.5) {
          warnEl.style.opacity = '1';
          if (Math.random() < 0.03) window.hospitalAudio.playDripSound();
          if (this.player.pitch > 0.22) {
            this.ceilingLookTimer += dt;
            if (this.ceilingLookTimer >= 0.5) {
              this.ceilingLookTimer = 0;
              const drain = 2 + Math.floor(Math.random() * 4);
              this.modifySanity(-drain, 'Looked up at Ceiling Monster');
              this.showToast(`👁️ DON'T LOOK UP! Looking at the ceiling drained Sanity! Point your camera down!`);
            }
          }
        } else {
          warnEl.style.opacity = '0';
        }
      }
    } else {
      warnEl.style.opacity = '0';
    }

    if (!this.underBedGrabState) {
      for (const room of this.wardRooms) {
        if (room.hasBedMonster && this.player.pos.distanceTo(room.pos) < 1.9) {
          this.underBedGrabState = { room, timer: 30, tickTimer: 0, struggleCount: 0 };
          this.modifySanity(-10, 'Grabbed by Under-Bed Monster');
          this.showToast(
            '👹 GRABBED BY UNDER-BED MONSTER (-10% Sanity)! Rapidly press [E] to hit it or feed it Maple Syrup / Organ!'
          );
          break;
        }
      }
    } else {
      this.underBedGrabState.timer -= dt;
      this.underBedGrabState.tickTimer += dt;
      if (this.underBedGrabState.tickTimer >= 2.0) {
        this.underBedGrabState.tickTimer = 0;
        this.modifySanity(-5, 'Under-Bed Monster Drain');
      }
      if (this.underBedGrabState.timer <= 0) {
        this.triggerGameOver('Dragged underneath the hospital bed by the Room 4 Under-Bed Monster!');
        return;
      }
    }

    for (let i = this.activePatients.length - 1; i >= 0; i--) {
      const p = this.activePatients[i];

      // Auto-Target & Zap Chasing Anomaly if Player holds Taser and can see the Anomaly!
      const isHoldingTaser =
        !!this.findHeldItem((it) => it.id === 'taser') ||
        (this.hasTaserEquipped && (this.keys['KeyT'] || this.keys['KeyQ'] || !this.heldItem));
      if (
        (p.state === 'chasing' || p.state === 'awakening_pause') &&
        p.mesh &&
        isHoldingTaser &&
        this.taserCooldown <= 0 &&
        this.isEntityVisibleOnScreen(p.mesh.position, 17.5)
      ) {
        window.hospitalAudio.playTaserZap();
        this.taserCooldown = 10; // 10-second reload!
        this.spawnTaserLightningBeam(p.mesh.position);
        this.killPatientOrAnomaly(p, 'Auto-Targeted by Held Taser');
        continue;
      }

      if (p.state === 'recovering') {
        p.recoveryTimer -= dt;
        if (p.recoveryTimer <= 0) {
          this.completePatientBedRecovery(p);
        }
      } else if (p.state === 'awakening_pause') {
        p.awakenPauseTimer -= dt;
        if (p.awakenPauseTimer <= 0) {
          p.state = 'chasing';
        }
      } else if (p.state === 'chasing' && p.mesh) {
        const cfg = window.GAME_DATA.shifts[this.currentShift - 1];
        const otherVictim =
          cfg?.hungryAnomaliesHuntPatients &&
          this.activePatients.find((op) => op !== p && op.state === 'in_bed' && op.mesh);

        if (otherVictim && p.huntPatientTimer > 0) {
          p.huntPatientTimer -= dt;
          const dx = otherVictim.mesh.position.x - p.mesh.position.x;
          const dz = otherVictim.mesh.position.z - p.mesh.position.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 1.2) {
            p.mesh.position.x += (dx / dist) * 3.8 * dt;
            p.mesh.position.z += (dz / dist) * 3.8 * dt;
            p.mesh.rotation.y = Math.atan2(dx, dz);
          } else if (p.huntPatientTimer <= 0) {
            this.showToast(`⚠️ Hungry Anomaly ate ${otherVictim.name} and fled the hospital!`);
            if (otherVictim.assignedRoom) {
              otherVictim.assignedRoom.patient = null;
              otherVictim.assignedRoom.lastPatientMesh = null;
              otherVictim.assignedRoom.signMat.color.setHex(0x22c55e);
            }
            this.scene.remove(otherVictim.mesh);
            this.removeActivePatient(otherVictim);
            this.scene.remove(p.mesh);
            this.removeActivePatient(p);
            setTimeout(() => this.spawnNextLobbyPatient(), 2000);
            continue;
          }
        } else {
          const dx = this.player.pos.x - p.mesh.position.x;
          const dz = this.player.pos.z - p.mesh.position.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 1.35) {
            p.mesh.position.x += (dx / dist) * 4.7 * dt;
            p.mesh.position.z += (dz / dist) * 4.7 * dt;
            p.mesh.rotation.y = Math.atan2(dx, dz);
          } else if (!this.isHiding) {
            window.hospitalAudio.playAnomalyScreech();
            this.modifySanity(-28, `Bitten by Anomaly ${p.name}`);
            this.showToast(`🩸 Anomaly ${p.name} bit you and fled the hospital!`);
            this.scene.remove(p.mesh);
            this.removeActivePatient(p);
            setTimeout(() => {
              this.spawnNextLobbyPatient();
              this.checkShiftCompletion();
            }, 2000);
          }
        }
      }
    }

    const slime = this.environmentalAnomalies.find((a) => a.type === 'slimebert');
    if (slime && slime.mesh) {
      if (slime.stunTimer > 0) {
        slime.stunTimer -= dt;
      } else {
        const dx = this.player.pos.x - slime.mesh.position.x;
        const dz = this.player.pos.z - slime.mesh.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 1.6) {
          slime.mesh.position.x += (dx / dist) * 2.6 * dt;
          slime.mesh.position.z += (dz / dist) * 2.6 * dt;
          slime.mesh.rotation.y = Math.atan2(dx, dz);
        } else if (!this.isHiding) {
          this.modifySanity(-12 * dt, 'Slimebert Digestion');
        }
      }
    }

    for (const room of this.wardRooms) {
      if (room.deathRitualActive) {
        room.ritualTimer -= dt;
        if (room.ritualTimer <= 0) {
          this.clearDeathRitual(room, `💀 Death Ritual timer expired in Room ${room.roomNumber}!`);
          if (room.patient) {
            this.killPatientOrAnomaly(room.patient, 'Death Ritual Failed');
          }
        }
      }
    }

    for (const er of this.emergencyRooms) {
      if (er.patient) {
        er.timer -= dt;
        if (er.timer <= 0) {
          const p = er.patient;
          er.patient = null;
          this.killPatientOrAnomaly(p, 'Emergency 1-Minute Timer Expired');
        }
      }
    }

    const cfg = window.GAME_DATA.shifts[this.currentShift - 1];
    if (cfg && cfg.cctvCanBreak && Math.random() < 0.0008) {
      const which = Math.random() < 0.5 ? 'reception' : 'corridor';
      if (!this.cctvBroken[which]) {
        this.cctvBroken[which] = true;
        this.showToast(`⚠️ ${which.toUpperCase()} CCTV CAMERA BROKE! Walk to the ${which} relay box and press [E] to fix it.`);
      }
    }

    const banner = document.getElementById('big-countdown-banner');
    if (this.shift12Phase === 'gun_countdown') {
      this.shift12Timer -= dt;
      banner.style.display = 'block';
      banner.textContent = `⚠️ HOLD GUN IMMEDIATELY! MANAGER ANOMALY CHARGES IN ${Math.ceil(this.shift12Timer)}s! (Press [T] to Shoot)`;
      if (this.shift12Timer <= 0) {
        this.shift12Phase = 'boss_chase';
      }
    } else if (this.shift12Phase === 'boss_chase' && this.bossEntity) {
      banner.style.display = 'block';
      banner.textContent = `🩸 APEX ANOMALY HUNTING AT 1.2x SPEED! SHOOT WITH GUN [T] NOW!`;
      const bMesh = this.bossEntity.mesh;
      const dx = this.player.pos.x - bMesh.position.x;
      const dz = this.player.pos.z - bMesh.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 1.4) {
        bMesh.position.x += (dx / dist) * this.bossEntity.speed * dt;
        bMesh.position.z += (dz / dist) * this.bossEntity.speed * dt;
        bMesh.rotation.y = Math.atan2(dx, dz);
      } else {
        this.modifySanity(-35 * dt, 'Apex Anomaly Attack');
      }
    } else if (this.shift12Phase === 'fire_countdown') {
      this.shift12Timer -= dt;
      banner.style.display = 'block';
      banner.textContent = `🔥 EQUIP FIRE EXTINGUISHER IMMEDIATELY! HOSPITAL FIRE IN ${Math.ceil(this.shift12Timer)}s!`;
      if (this.shift12Timer <= 0) {
        this.igniteHospitalFire();
      }
    } else if (this.shift12Phase === 'extinguish_fire') {
      banner.style.display = 'block';
      banner.textContent = `🧯 EXTINGUISH ALL HOSPITAL FIRES WITH [T] (${this.fireNodes ? this.fireNodes.length : 0} REMAINING)!`;
    } else if (this.isDiscoFinale) {
      this.discoBallMesh.rotation.y += dt * 2.5;
      if (this.discoDancers) {
        this.discoDancers.forEach((d, idx) => {
          d.position.y = Math.abs(Math.sin(performance.now() * 0.007 + idx)) * 0.45;
          d.rotation.y += dt * 3.0;
        });
      }
    }

    if (Math.random() < 0.15) {
      this.updateHUD();
    }
  }

  updateCameraAndSigns() {
    this.camera.position.copy(this.player.pos);
    if (this.isDiscoFinale && this.isDancingPlayer) {
      this.camera.position.y += Math.abs(Math.sin(performance.now() * 0.009)) * 0.35;
    }
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;

    const dx = this.compassTargetPos.x - this.player.pos.x;
    const dz = this.compassTargetPos.z - this.player.pos.z;
    const targetAngle = Math.atan2(-dx, -dz);
    const relAngle = targetAngle - this.player.yaw;
    const arrowEl = document.getElementById('compass-arrow');
    if (arrowEl) {
      arrowEl.style.transform = `rotate(${-relAngle}rad)`;
    }

    const nearest = this.findNearestInteractable();
    const promptEl = document.getElementById('context-prompt');
    if (nearest && this.state === 'playing' && !this.isPaused) {
      promptEl.style.display = 'block';
      promptEl.textContent = `[E] ${nearest.prompt}`;
    } else {
      promptEl.style.display = 'none';
    }

    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;

    for (const item of this.interactables) {
      const el = item.signEl;
      if (!el) continue;
      if (this.state !== 'playing' || (item.isVisibleFn && !item.isVisibleFn())) {
        el.style.display = 'none';
        continue;
      }
      const maxD = item.maxSignDist || 7.5;
      const dist = this.player.pos.distanceTo(item.pos);
      if (dist > maxD) {
        el.style.display = 'none';
        continue;
      }
      const proj = item.pos.clone().project(this.camera);
      if (proj.z > 1) {
        el.style.display = 'none';
        continue;
      }
      const sx = proj.x * halfW + halfW;
      const sy = -proj.y * halfH + halfH;
      el.style.display = 'block';
      el.style.left = `${sx}px`;
      el.style.top = `${sy}px`;
    }

    for (const peer of this.coop.peers.values()) {
      if (!peer.labelEl) {
        peer.labelEl = document.createElement('div');
        peer.labelEl.className = 'world-sign sign-player';
        document.getElementById('world-labels-container').appendChild(peer.labelEl);
      }
      if (this.state !== 'playing' || !peer.mesh) {
        peer.labelEl.style.display = 'none';
        continue;
      }
      const pPos = peer.mesh.position.clone().add(new THREE.Vector3(0, 1.95, 0));
      const proj = pPos.project(this.camera);
      if (proj.z > 1) {
        peer.labelEl.style.display = 'none';
        continue;
      }
      peer.labelEl.style.display = 'block';
      peer.labelEl.style.left = `${proj.x * halfW + halfW}px`;
      peer.labelEl.style.top = `${-proj.y * halfH + halfH}px`;
      peer.labelEl.textContent = `🩺 ${peer.nickname}${peer.downed ? ' [DOWNED - REVIVE!]' : ''}`;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new AnomalyHospitalGame();
});
