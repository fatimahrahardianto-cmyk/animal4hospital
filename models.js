/* ============================================================================
   ANOMALY HOSPITAL - 3D Models, Procedural Textures, ID Card, & Photo Renderer
   ============================================================================ */

window.HospitalModels = {
  createFaceTexture(options = {}) {
    const {
      baseColor = '#f8fafc',
      eyeMode = 'normal',
      mouthOpen = false,
      isRathew = false
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = isRathew ? '#1e242b' : baseColor;
    ctx.fillRect(0, 0, 256, 256);

    const grad = ctx.createRadialGradient(128, 128, 30, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255,255,255,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    if (eyeMode === 'uv_infected') {
      ctx.strokeStyle = '#d946ef';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#f0abfc';
      ctx.shadowBlur = 12;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(40 + i * 28, 30);
        ctx.bezierCurveTo(60 + i * 20, 90, 30 + i * 25, 160, 50 + i * 24, 225);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    const drawEye = (cx, cy) => {
      ctx.save();
      ctx.translate(cx, cy);

      if (eyeMode === 'red_awakened' || eyeMode === 'stalker') {
        const halo = ctx.createRadialGradient(0, 0, 10, 0, 0, 44);
        halo.addColorStop(0, 'rgba(220, 38, 38, 0.9)');
        halo.addColorStop(0.6, 'rgba(0, 0, 0, 0.85)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 44, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = eyeMode === 'red_awakened' ? '#fecaca' : '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-34, 0);
      ctx.quadraticCurveTo(0, -32, 34, 0);
      ctx.quadraticCurveTo(0, 32, -34, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle =
        eyeMode === 'red_awakened'
          ? '#dc2626'
          : eyeMode === 'uv_infected'
          ? '#a855f7'
          : '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, 0, eyeMode === 'red_awakened' ? 19 : 21, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      if (eyeMode === 'red_awakened') {
        ctx.fillStyle = '#450a0a';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(-6, -6, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-7, -7, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(7, 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    drawEye(76, 118);
    drawEye(180, 118);

    if (mouthOpen || eyeMode === 'red_awakened') {
      ctx.fillStyle = '#180404';
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(128, 188, 42, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      for (let i = -3; i <= 3; i++) {
        const tx = 128 + i * 10;
        ctx.beginPath();
        ctx.moveTo(tx - 4, 166);
        ctx.lineTo(tx + 4, 166);
        ctx.lineTo(tx, 182);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(tx - 4, 210);
        ctx.lineTo(tx + 4, 210);
        ctx.lineTo(tx, 194);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = isRathew ? '#f8fafc' : '#0f172a';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(117, 178);
      ctx.lineTo(128, 167);
      ctx.lineTo(139, 178);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  },

  createAnimalPatientMesh(patientData) {
    const group = new THREE.Group();
    const isRathew = patientData.specialType === 'rathew';
    const isStalker = patientData.specialType === 'rattina_stalker';
    const isSlimebert = patientData.specialType === 'slimebert';

    if (isSlimebert) {
      return this.createSlimebertMesh();
    }

    const colorHex = isRathew ? '#1e242b' : (patientData.color?.hex || '#f9a8d4');
    const colorNum = isRathew ? 0x1e242b : (patientData.color?.num || 0xf9a8d4);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorNum,
      roughness: 0.55,
      metalness: 0.05
    });

    const faceTex = this.createFaceTexture({
      baseColor: colorHex,
      eyeMode: isStalker ? 'stalker' : 'normal',
      mouthOpen: false,
      isRathew
    });

    const headGeo = new THREE.SphereGeometry(0.42, 20, 18);
    headGeo.scale(1.08, 0.96, 0.98);
    const headMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      roughness: 0.5,
      metalness: 0.05
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.42;
    headMesh.rotation.y = -Math.PI / 2;
    headMesh.castShadow = true;
    group.add(headMesh);

    const earGroup = new THREE.Group();
    earGroup.position.y = 1.42;
    const speciesId = patientData.species?.id || 'rabbit';

    if (speciesId === 'rabbit') {
      const earGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.48, 12);
      const earL = new THREE.Mesh(earGeo, bodyMat);
      earL.position.set(-0.16, 0.48, 0);
      earL.rotation.z = 0.08;
      const earR = new THREE.Mesh(earGeo, bodyMat);
      earR.position.set(0.16, 0.48, 0);
      earR.rotation.z = -0.08;
      earGroup.add(earL, earR);
    } else if (speciesId === 'cat') {
      const earGeo = new THREE.ConeGeometry(0.15, 0.34, 12);
      const earL = new THREE.Mesh(earGeo, bodyMat);
      earL.position.set(-0.24, 0.38, 0);
      earL.rotation.z = 0.28;
      const earR = new THREE.Mesh(earGeo, bodyMat);
      earR.position.set(0.24, 0.38, 0);
      earR.rotation.z = -0.28;
      earGroup.add(earL, earR);
    } else if (speciesId === 'dog') {
      const earGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.42, 12);
      const earL = new THREE.Mesh(earGeo, bodyMat);
      earL.position.set(-0.42, 0.02, 0);
      earL.rotation.z = 0.32;
      const earR = new THREE.Mesh(earGeo, bodyMat);
      earR.position.set(0.42, 0.02, 0);
      earR.rotation.z = -0.32;
      earGroup.add(earL, earR);
    } else if (speciesId === 'bear' || isRathew) {
      const earGeo = new THREE.SphereGeometry(0.16, 12, 12);
      const earL = new THREE.Mesh(earGeo, bodyMat);
      earL.position.set(-0.32, 0.34, 0);
      const earR = new THREE.Mesh(earGeo, bodyMat);
      earR.position.set(0.32, 0.34, 0);
      earGroup.add(earL, earR);
    } else if (speciesId === 'devil_cat') {
      const hornGeo = new THREE.ConeGeometry(0.12, 0.42, 12);
      const hornL = new THREE.Mesh(hornGeo, bodyMat);
      hornL.position.set(-0.26, 0.42, 0.04);
      hornL.rotation.z = 0.38;
      const hornR = new THREE.Mesh(hornGeo, bodyMat);
      hornR.position.set(0.26, 0.42, 0.04);
      hornR.rotation.z = -0.38;
      earGroup.add(hornL, hornR);
    }

    if (isStalker || patientData.hasRibbon) {
      const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0x831843 });
      const bowCenter = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), ribbonMat);
      bowCenter.position.set(0, 0.42, 0.25);
      const bowL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 8), ribbonMat);
      bowL.rotation.z = Math.PI / 2;
      bowL.position.set(-0.12, 0.42, 0.25);
      const bowR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 8), ribbonMat);
      bowR.rotation.z = -Math.PI / 2;
      bowR.position.set(0.12, 0.42, 0.25);
      earGroup.add(bowCenter, bowL, bowR);
    }

    group.add(earGroup);

    const torsoGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.68, 14);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.y = 0.78;
    torso.castShadow = true;
    group.add(torso);

    const armGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.52, 10);
    const armL = new THREE.Mesh(armGeo, bodyMat);
    armL.position.set(-0.32, 0.78, 0);
    armL.rotation.z = 0.32;
    const armR = new THREE.Mesh(armGeo, bodyMat);
    armR.position.set(0.32, 0.78, 0);
    armR.rotation.z = -0.32;
    group.add(armL, armR);

    const legGeo = new THREE.CylinderGeometry(0.085, 0.075, 0.48, 10);
    const legL = new THREE.Mesh(legGeo, bodyMat);
    legL.position.set(-0.13, 0.24, 0);
    const legR = new THREE.Mesh(legGeo, bodyMat);
    legR.position.set(0.13, 0.24, 0);
    group.add(legL, legR);

    group.userData = {
      headMesh,
      bodyMat,
      earGroup,
      armL,
      armR,
      legL,
      legR,
      patientData,
      setVisualMode: (mode) => {
        if (mode === 'awakened_red') {
          bodyMat.color.setHex(0xdc2626);
          bodyMat.emissive.setHex(0x7f1d1d);
          headMesh.material.map = this.createFaceTexture({
            baseColor: '#ef4444',
            eyeMode: 'red_awakened',
            mouthOpen: true
          });
          headMesh.material.emissive = new THREE.Color(0x450a0a);
          headMesh.material.needsUpdate = true;
        } else if (mode === 'uv_reveal') {
          headMesh.material.map = this.createFaceTexture({
            baseColor: colorHex,
            eyeMode: 'uv_infected',
            mouthOpen: false,
            isRathew
          });
          headMesh.material.needsUpdate = true;
        } else if (mode === 'lightbulb_gag') {
          bodyMat.emissive.setHex(0xfde047);
          headMesh.material.emissive = new THREE.Color(0xfef08a);
        } else {
          bodyMat.color.setHex(colorNum);
          bodyMat.emissive.setHex(0x000000);
          headMesh.material.emissive = new THREE.Color(0x000000);
          headMesh.material.map = this.createFaceTexture({
            baseColor: colorHex,
            eyeMode: isStalker ? 'stalker' : 'normal',
            mouthOpen: false,
            isRathew
          });
          headMesh.material.needsUpdate = true;
        }
      }
    };

    return group;
  },

  createSlimebertMesh() {
    const group = new THREE.Group();
    const slimeMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x052e16,
      roughness: 0.15,
      transparent: true,
      opacity: 0.88
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 16), slimeMat);
    body.scale.set(1.15, 0.95, 1.15);
    body.position.y = 0.75;
    group.add(body);

    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, emissive: 0x6b21a8 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), eyeMat);
    eyeL.position.set(-0.28, 0.95, 0.78);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), eyeMat);
    eyeR.position.set(0.28, 0.95, 0.78);
    group.add(eyeL, eyeR);

    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x064e3b });
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.12), mouthMat);
    mouth.position.set(0, 0.62, 0.82);
    group.add(mouth);

    group.userData = { isSlimebert: true, slimeMat };
    return group;
  },

  create3DPatientIDCard(patientName) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#002884';
    ctx.fillRect(0, 0, 512, 280);

    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 272);

    ctx.fillStyle = '#b0b8c4';
    ctx.font = 'bold 58px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PATIENT', 256, 78);

    ctx.fillStyle = '#a8a8a8';
    ctx.fillRect(24, 138, 464, 118);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif';
    ctx.fillText(patientName || 'Unknown Patient', 256, 198);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;

    const geo = new THREE.BoxGeometry(0.42, 0.02, 0.24);
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x002884 }),
      new THREE.MeshStandardMaterial({ color: 0x002884 }),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x002884 }),
      new THREE.MeshStandardMaterial({ color: 0x002884 }),
      new THREE.MeshStandardMaterial({ color: 0x002884 })
    ];
    const cardMesh = new THREE.Mesh(geo, materials);
    cardMesh.castShadow = true;
    return cardMesh;
  },

  renderPatientSnapshot(canvas, patient, mode = 'polaroid', uvActive = false) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = mode === 'cctv' ? '#0f1c2e' : '#787143';
    ctx.fillRect(0, 0, w, h * 0.45);
    ctx.fillStyle = mode === 'cctv' ? '#153243' : '#2c6e91';
    ctx.fillRect(0, h * 0.45, w, h * 0.55);

    if (!patient) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO PATIENT IN FRAME', w / 2, h / 2);
      return;
    }

    const pColor = patient.specialType === 'rathew' ? '#1e242b' : (patient.color?.hex || '#f8fafc');
    const anomType = patient.anomalyDetectionType;

    const showSubtleEarMutation = mode === 'polaroid' && anomType === 'photo_subtle';
    const showHorrificEyes =
      (mode === 'polaroid' && anomType === 'photo_horrific') ||
      (mode === 'cctv' && anomType === 'cctv') ||
      (uvActive && anomType === 'uv') ||
      patient.specialType === 'rattina_stalker';

    const cx = w / 2;
    const cy = h * 0.56;

    ctx.fillStyle = pColor;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 48, h);
    ctx.lineTo(cx - 32, cy + 45);
    ctx.lineTo(cx + 32, cy + 45);
    ctx.lineTo(cx + 48, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const speciesId = patient.species?.id || 'rabbit';
    ctx.fillStyle = pColor;

    const drawSingleEar = (side, forceFloppy) => {
      ctx.save();
      ctx.translate(cx, cy);
      if (forceFloppy || speciesId === 'dog') {
        ctx.beginPath();
        ctx.ellipse(side * 66, -10, 20, 56, side * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (speciesId === 'rabbit') {
        ctx.beginPath();
        ctx.ellipse(side * 28, -90, 18, 48, side * 0.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (speciesId === 'cat' || speciesId === 'devil_cat') {
        ctx.beginPath();
        ctx.moveTo(side * 15, -52);
        ctx.lineTo(side * 55, -105);
        ctx.lineTo(side * 62, -32);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(side * 52, -62, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    };

    drawSingleEar(-1, showSubtleEarMutation);
    drawSingleEar(1, false);

    ctx.fillStyle = pColor;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 68, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (uvActive && anomType === 'uv') {
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 18, cy - 45);
        ctx.lineTo(cx + i * 22, cy + 45);
        ctx.stroke();
      }
    }

    const drawPhotoEye = (ex, ey) => {
      if (showHorrificEyes) {
        const grad = ctx.createRadialGradient(ex, ey, 4, ex, ey, 30);
        grad.addColorStop(0, 'rgba(220, 38, 38, 0.95)');
        grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.9)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ex, ey, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fecaca';
        ctx.beginPath();
        ctx.ellipse(ex, ey, 22, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = mode === 'cctv' ? '#ef4444' : '#7f1d1d';
        ctx.beginPath();
        ctx.arc(ex, ey, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(ex, ey, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(ex, ey, 19, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(ex, ey, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex - 4, ey - 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawPhotoEye(cx - 28, cy - 4);
    drawPhotoEye(cx + 28, cy - 4);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (showHorrificEyes && mode === 'cctv') {
      ctx.arc(cx, cy + 32, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#450a0a';
      ctx.fill();
    } else {
      ctx.moveTo(cx - 8, cy + 30);
      ctx.lineTo(cx, cy + 22);
      ctx.lineTo(cx + 8, cy + 30);
    }
    ctx.stroke();

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const noiseStrength = mode === 'polaroid' ? 68 : 36;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * noiseStrength;
      data[i] = Math.min(255, Math.max(0, data[i] + grain));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
    }
    ctx.putImageData(imgData, 0, 0);

    if (mode === 'cctv') {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('CAM-01 RECEPTION LIVE', 10, 20);
      if (anomType === 'cctv') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.fillRect(0, h * 0.38, w, 18);
        ctx.fillStyle = '#fca5a5';
        ctx.fillText('! BIO-SIGNAL DISTORTION DETECTED !', 10, h - 12);
      }
    }
  }
};
