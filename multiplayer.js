/* ============================================================================
   ANOMALY HOSPITAL - Co-op Multiplayer Sync, Invite Link, & AI Partner System
   ============================================================================ */

class CoopMultiplayerManager {
  constructor(game) {
    this.game = game;
    this.roomCode = 'HOSP-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    this.channel = null;
    this.peers = new Map();
    this.localId = 'DOC-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    this.aiPartner = null;
  }

  initFromURL() {
    const params = new URLSearchParams(window.location.search);
    const invitedRoom = params.get('room');
    if (invitedRoom) {
      this.roomCode = invitedRoom;
      const modeSelect = document.getElementById('game-mode-select');
      if (modeSelect) modeSelect.value = 'coop';
    }
    const roomInput = document.getElementById('coop-room-code');
    if (roomInput) roomInput.value = this.roomCode;
    this.connectChannel(this.roomCode);
  }

  connectChannel(code) {
    this.roomCode = code;
    if (this.channel) {
      this.channel.close();
    }
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('anomaly_hospital_' + this.roomCode);
      this.channel.onmessage = (ev) => this.handleMessage(ev.data);
    }
  }

  generateInviteLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('room', this.roomCode);
    return url.toString();
  }

  broadcast(type, payload = {}) {
    if (!this.channel) return;
    this.channel.postMessage({
      type,
      senderId: this.localId,
      nickname: this.game.playerNickname,
      skinHex: this.game.playerSkinHex,
      ...payload
    });
  }

  handleMessage(msg) {
    if (!msg || msg.senderId === this.localId) return;

    if (msg.type === 'player_state') {
      let peer = this.peers.get(msg.senderId);
      if (!peer && this.game.scene) {
        peer = this.createPeerAvatar(msg.senderId, msg.nickname, msg.skinHex);
        this.peers.set(msg.senderId, peer);
        this.game.showToast(`Co-op Friend "${msg.nickname}" joined the hospital!`);
      }
      if (peer) {
        peer.nickname = msg.nickname || peer.nickname;
        peer.x = msg.x;
        peer.y = msg.y;
        peer.z = msg.z;
        peer.rotY = msg.rotY;
        peer.downed = msg.downed;
        peer.score = msg.score || 0;
        peer.holdingGun = !!msg.holdingGun;
        if (peer.mesh) {
          peer.mesh.position.set(msg.x, msg.y, msg.z);
          peer.mesh.rotation.y = msg.rotY;
          peer.mesh.rotation.z = msg.downed ? Math.PI / 2 : 0;
        }
      }
    } else if (msg.type === 'milk_drank') {
      this.game.triggerSharedMilkCooldown(msg.nickname);
    } else if (msg.type === 'revive_player') {
      if (msg.targetId === this.localId && this.game.isDowned) {
        this.game.completeReviveByFriend(msg.nickname);
      }
    } else if (msg.type === 'gun_taken') {
      this.game.stationGunHolder = msg.nickname;
    }
  }

  createPeerAvatar(id, nickname, skinHex = '#34d399') {
    const group = new THREE.Group();
    const coatMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinHex),
      roughness: 0.45
    });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.5 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 1.05, 12), coatMat);
    body.position.y = 0.65;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 14), headMat);
    head.position.y = 1.42;
    group.add(head);

    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.1, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x2563eb })
    );
    badge.position.set(0.12, 0.95, 0.27);
    group.add(badge);

    this.game.scene.add(group);
    return {
      id,
      nickname: nickname || 'Dr. Friend',
      skinHex,
      mesh: group,
      x: 2.5,
      y: 0,
      z: 8.5,
      rotY: 0,
      downed: false,
      score: 0,
      holdingGun: false
    };
  }

  spawnAICoopPartnerIfNeeded() {
    this.clearPeers();
    if (this.game.gameMode !== 'coop') return;

    const partnerName = 'Dr. Alex (Co-op)';
    const avatar = this.createPeerAvatar('AI_COOP', partnerName, '#34d399');
    avatar.x = 2.8;
    avatar.z = 9.0;
    avatar.mesh.position.set(avatar.x, 0, avatar.z);
    this.aiPartner = avatar;
    this.peers.set('AI_COOP', avatar);
  }

  clearPeers() {
    for (const peer of this.peers.values()) {
      if (peer.mesh && this.game.scene) {
        this.game.scene.remove(peer.mesh);
      }
      if (peer.labelEl && peer.labelEl.parentNode) {
        peer.labelEl.parentNode.removeChild(peer.labelEl);
      }
    }
    this.peers.clear();
    this.aiPartner = null;
  }

  update(dt) {
    if (this.game.state === 'playing') {
      this.broadcast('player_state', {
        x: this.game.player.pos.x,
        y: 0,
        z: this.game.player.pos.z,
        rotY: this.game.player.yaw,
        downed: this.game.isDowned,
        score: this.game.playerContributionScore,
        holdingGun: this.game.heldItem?.id === 'station_gun'
      });
    }

    if (this.aiPartner && this.game.state === 'playing' && !this.game.isPaused) {
      const ai = this.aiPartner;
      if (this.game.isDiscoFinale) {
        ai.mesh.position.y = Math.abs(Math.sin(performance.now() * 0.008)) * 0.45;
        ai.mesh.rotation.y += dt * 3.5;
        return;
      }

      if (this.game.isDowned) {
        const dx = this.game.player.pos.x - ai.x;
        const dz = this.game.player.pos.z - ai.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 1.3) {
          ai.x += (dx / dist) * 4.2 * dt;
          ai.z += (dz / dist) * 4.2 * dt;
          ai.rotY = Math.atan2(dx, dz);
        } else {
          this.game.completeReviveByFriend(ai.nickname);
          ai.score += 2;
        }
      } else {
        const t = performance.now() * 0.0004;
        const targetX = Math.sin(t * 1.7) * 3.2;
        const targetZ = 4.0 + Math.cos(t) * 5.0;
        const dx = targetX - ai.x;
        const dz = targetZ - ai.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.2) {
          ai.x += (dx / dist) * 2.2 * dt;
          ai.z += (dz / dist) * 2.2 * dt;
          ai.rotY = Math.atan2(dx, dz);
        }
      }
      ai.mesh.position.set(ai.x, 0, ai.z);
      ai.mesh.rotation.y = ai.rotY;
    }
  }
}

window.CoopMultiplayerManager = CoopMultiplayerManager;
