/* ============================================================================
   ANOMALY HOSPITAL - 3D Hospital Architecture, Rooms, Shelves, & Stations
   ============================================================================ */

window.HospitalWorldBuilder = {
  buildHospital(game) {
    const scene = game.scene;
    game.interactables = [];
    game.wardRooms = [];
    game.emergencyRooms = [];
    game.ceilingLights = [];
    game.fireParticles = [];
    game.colliders = [];

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e4e68,
      roughness: 0.45,
      metalness: 0.08
    });
    const receptionFloorMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.35
    });
    const wallLowerMat = new THREE.MeshStandardMaterial({
      color: 0x285e7a,
      roughness: 0.65
    });
    const wallUpperMat = new THREE.MeshStandardMaterial({
      color: 0x6b6640,
      roughness: 0.7
    });
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85
    });
    const counterMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.32,
      roughness: 0.1
    });

    const mainFloor = new THREE.Mesh(new THREE.PlaneGeometry(46, 60), floorMat);
    mainFloor.rotation.x = -Math.PI / 2;
    mainFloor.position.set(0, 0, -10);
    mainFloor.receiveShadow = true;
    scene.add(mainFloor);

    const recFloor = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), receptionFloorMat);
    recFloor.rotation.x = -Math.PI / 2;
    recFloor.position.set(0, 0.01, 10);
    recFloor.receiveShadow = true;
    scene.add(recFloor);

    const rug = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 0.03, 3.4),
      new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.9 })
    );
    rug.position.set(0, 0.02, 10);
    scene.add(rug);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(46, 60), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 4.2, -10);
    scene.add(ceiling);

    const addWall = (x, z, w, d, h = 4.2, collide = true) => {
      const group = new THREE.Group();
      const lower = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.55, d), wallLowerMat);
      lower.position.y = (h * 0.55) / 2;
      const upper = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.45, d), wallUpperMat);
      upper.position.y = h * 0.55 + (h * 0.45) / 2;
      group.add(lower, upper);
      group.position.set(x, 0, z);
      scene.add(group);
      if (collide) {
        game.colliders.push({
          minX: x - w / 2 - 0.35,
          maxX: x + w / 2 + 0.35,
          minZ: z - d / 2 - 0.35,
          maxZ: z + d / 2 + 0.35
        });
      }
      return group;
    };

    addWall(0, 15, 22, 0.4);
    addWall(-11, 7, 0.4, 16);
    addWall(11, 7, 0.4, 16);

    const counterDesk = new THREE.Mesh(new THREE.BoxGeometry(10.5, 1.1, 1.1), counterMat);
    counterDesk.position.set(-1.5, 0.55, 6.2);
    scene.add(counterDesk);
    game.colliders.push({ minX: -6.8, maxX: 3.8, minZ: 5.5, maxZ: 6.9 });

    const glassWindow = new THREE.Mesh(new THREE.BoxGeometry(10.2, 1.9, 0.08), glassMat);
    glassWindow.position.set(-1.5, 2.05, 6.2);
    scene.add(glassWindow);

    const shutterMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.5, roughness: 0.4 });
    game.shutterMesh = new THREE.Mesh(new THREE.BoxGeometry(10.3, 1.95, 0.14), shutterMat);
    game.shutterMesh.position.set(-1.5, 3.65, 6.2);
    scene.add(game.shutterMesh);

    addWall(8.5, 6.2, 4.8, 0.35);

    // 1. Tripod Camera (g-cam)
    const camGroup = new THREE.Group();
    const camBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.36, 0.48),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    camBody.position.y = 1.38;
    const camLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.25, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8 })
    );
    camLens.rotation.x = Math.PI / 2;
    camLens.position.set(0, 1.38, -0.3);
    camGroup.add(camBody, camLens);
    camGroup.position.set(-4.2, 0, 6.4);
    scene.add(camGroup);

    game.registerInteractable({
      id: 'registration_camera',
      name: 'g-cam Snapshot Camera',
      prompt: 'Take Polaroid Snapshot of Patient',
      pos: new THREE.Vector3(-4.2, 1.45, 6.5),
      action: () => game.takePatientSnapshot(false)
    });

    // 2. CCTV & Registration Computer
    const pcGroup = new THREE.Group();
    const monitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.58, 0.42),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1 })
    );
    monitor.position.y = 1.42;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.44),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    screen.position.set(0, 1.42, 0.22);
    pcGroup.add(monitor, screen);
    pcGroup.position.set(-0.8, 0, 6.4);
    scene.add(pcGroup);

    game.registerInteractable({
      id: 'registration_pc',
      name: 'CCTV & Registration PC',
      prompt: 'Open CCTV & Patient Check-In Terminal',
      pos: new THREE.Vector3(-0.8, 1.45, 6.5),
      action: () => game.openCCTVTerminal()
    });

    // 3. Physical ID Tag Printer
    const printerGroup = new THREE.Group();
    const printerBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.36, 0.58),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
    );
    printerBody.position.y = 1.28;
    const printerTray = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.04, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    printerTray.position.set(0, 1.14, 0.38);
    printerGroup.add(printerBody, printerTray);
    printerGroup.position.set(1.4, 0, 6.4);
    scene.add(printerGroup);
    game.printerGroup = printerGroup;

    game.registerInteractable({
      id: 'id_printer',
      name: 'ID Tag Printer',
      prompt: 'Print / Pick Up 3D Patient ID Card',
      pos: new THREE.Vector3(1.4, 1.38, 6.6),
      action: () => game.interactWithPrinter()
    });

    // 4. Red Shutters Button + Sticky Note
    const shutterBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.46, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x7f1d1d })
    );
    shutterBox.position.set(4.1, 1.55, 6.35);
    scene.add(shutterBox);

    const stickyNote = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.26, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    stickyNote.position.set(4.1, 1.2, 6.38);
    scene.add(stickyNote);

    game.registerInteractable({
      id: 'shutter_button',
      name: 'SHUTTERS (Reject Patient)',
      prompt: 'Press Shutters to Decline Patient',
      pos: new THREE.Vector3(4.1, 1.55, 6.5),
      isDanger: true,
      action: () => game.declineCurrentPatient()
    });

    // 5. Milk Station
    const milkTable = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 1.1), counterMat);
    milkTable.position.set(-7.8, 0.48, 10.5);
    scene.add(milkTable);
    for (let i = 0; i < 3; i++) {
      const mug = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.24, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      mug.position.set(-8.2 + i * 0.4, 1.08, 10.5);
      scene.add(mug);
    }

    game.registerInteractable({
      id: 'milk_station',
      name: 'Cooldown Milk Station (+25% Sanity)',
      prompt: 'Drink Cup of Milk (+25% Heart / 35s Shared Cooldown)',
      pos: new THREE.Vector3(-7.8, 1.25, 10.5),
      action: () => game.drinkMilkAtStation()
    });

    // 6. Taser Display Station
    const taserStand = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.3, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    taserStand.position.set(7.8, 0.65, 10.5);
    scene.add(taserStand);
    const taserModel = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.2, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0x713f12 })
    );
    taserModel.position.set(7.8, 1.4, 10.5);
    scene.add(taserModel);

    game.registerInteractable({
      id: 'taser_station',
      name: 'Taser Display Box (Reception)',
      prompt: 'Hold / Equip Taser (Auto-Targets Visible Chasing Anomalies / 10s Reload)',
      pos: new THREE.Vector3(7.8, 1.45, 10.5),
      action: () => game.equipTaserFromStation()
    });

    // 7. Supplies Shop & Free Fire Extinguisher
    const shopKiosk = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.8, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x0284c7 })
    );
    shopKiosk.position.set(7.8, 0.9, 13.2);
    scene.add(shopKiosk);

    game.registerInteractable({
      id: 'supplies_shop',
      name: 'Hospital Supplies Shop (Scanner / Boosts / Sam)',
      prompt: 'Open Supplies Shop',
      pos: new THREE.Vector3(7.8, 1.5, 13.2),
      action: () => game.openShopModal()
    });

    const extCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.72, 14),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.3 })
    );
    extCylinder.position.set(6.2, 0.55, 13.4);
    scene.add(extCylinder);

    game.registerInteractable({
      id: 'fire_extinguisher',
      name: 'Fire Extinguisher (Free Shift 3+)',
      prompt: 'Take Fire Extinguisher (Stuns Slimebert / Clears Camo & Fires)',
      pos: new THREE.Vector3(6.2, 1.0, 13.4),
      action: () => game.pickupFireExtinguisher()
    });

    // 8. Defense Gun Station
    const gunCase = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46 })
    );
    gunCase.position.set(-4.5, 0.55, 13.8);
    scene.add(gunCase);

    game.registerInteractable({
      id: 'gun_station',
      name: 'Emergency Firearms Locker (1 Player Max)',
      prompt: 'Equip Defense Gun',
      pos: new THREE.Vector3(-4.5, 1.25, 13.8),
      action: () => game.equipStationGun()
    });

    // 9. Hiding Locker
    const locker = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.5, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.4 })
    );
    locker.position.set(-9.5, 1.25, 13.4);
    scene.add(locker);

    game.registerInteractable({
      id: 'hiding_spot',
      name: 'Emergency Hiding Locker',
      prompt: 'Hide Inside / Exit Hiding Spot',
      pos: new THREE.Vector3(-9.5, 1.5, 13.4),
      action: () => game.toggleHidingSpot()
    });

    // 10. Trash Can
    const trashCan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.3, 0.9, 12),
      new THREE.MeshStandardMaterial({ color: 0x16a34a })
    );
    trashCan.position.set(3.2, 0.45, 7.4);
    scene.add(trashCan);

    game.registerInteractable({
      id: 'trash_can',
      name: 'Hospital Recycle / Disposal Bin',
      prompt: 'Throw Held Item / Fainted Body in Trash Can',
      pos: new THREE.Vector3(3.2, 1.0, 7.4),
      action: () => game.useTrashCan()
    });

    // 11. Wheelchair / Wheelbed
    const wheelbedGroup = new THREE.Group();
    const wbFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.65, 1.7),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
    );
    wbFrame.position.y = 0.45;
    wheelbedGroup.add(wbFrame);
    wheelbedGroup.position.set(5.5, 0, 3.2);
    scene.add(wheelbedGroup);

    game.registerInteractable({
      id: 'wheelbed_station',
      name: 'Hospital Wheelchair / Wheelbed (+30s Emergency Timer)',
      prompt: 'Equip Wheelchair / Wheelbed (Fast Patient Transport)',
      pos: new THREE.Vector3(5.5, 1.0, 3.2),
      action: () => game.equipWheelbed()
    });

    // 12. Two Repairable CCTV Camera Nodes
    const cctvBox1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.5, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    cctvBox1.position.set(-5.8, 1.5, 7.2);
    scene.add(cctvBox1);
    game.registerInteractable({
      id: 'cctv_repair_reception',
      name: 'Reception CCTV Relay Box',
      prompt: 'Fix Reception CCTV Camera',
      pos: new THREE.Vector3(-5.8, 1.5, 7.2),
      action: () => game.repairCCTV('reception')
    });

    const cctvBox2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.5, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    cctvBox2.position.set(-3.4, 1.5, -10.0);
    scene.add(cctvBox2);
    game.registerInteractable({
      id: 'cctv_repair_corridor',
      name: 'Corridor CCTV Relay Box',
      prompt: 'Fix Corridor CCTV Camera',
      pos: new THREE.Vector3(-3.4, 1.5, -10.0),
      action: () => game.repairCCTV('corridor')
    });

    // 13. Fuse Box
    const fuseBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.7, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    fuseBox.position.set(3.4, 1.5, -10.0);
    scene.add(fuseBox);
    game.registerInteractable({
      id: 'fuse_box',
      name: 'Main Hospital Fuse Box (Power & Lightbulb Gag)',
      prompt: 'Flip Fuse Breaker (Restore Lights)',
      pos: new THREE.Vector3(3.4, 1.5, -10.0),
      action: () => game.flipFuseBox()
    });

    // Supply Hallway Dispenser Shelves (All 10 Medicines)
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.3 });
    window.GAME_DATA.wardMedicines.forEach((med, index) => {
      const isLeft = index < 5;
      const row = index % 5;
      const sx = isLeft ? -3.1 : 3.1;
      const sz = -1.5 - row * 1.65;

      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.05, 0.8), shelfMat);
      pedestal.position.set(sx, 0.52, sz);
      scene.add(pedestal);

      const itemMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.34, 12),
        new THREE.MeshStandardMaterial({ color: med.color, roughness: 0.3 })
      );
      itemMesh.position.set(sx, 1.22, sz);
      scene.add(itemMesh);

      game.registerInteractable({
        id: 'med_' + med.id,
        name: `${med.icon} ${med.name} (${med.symptom})`,
        prompt: `Take ${med.name} — ${med.desc}`,
        pos: new THREE.Vector3(sx, 1.45, sz),
        maxSignDist: 5.5,
        action: () => game.pickupMedicine(med)
      });
    });

    // 8 Private Ward Rooms (Rooms 101 - 108)
    for (let i = 0; i < 8; i++) {
      const isLeft = i < 4;
      const idx = i % 4;
      const roomNum = 101 + i;
      const rx = isLeft ? -8.5 : 8.5;
      const rz = -3.0 - idx * 5.2;
      const doorX = isLeft ? -4.2 : 4.2;

      addWall(rx, rz - 2.4, 8.2, 0.25, 4.2, true);
      addWall(rx, rz + 2.4, 8.2, 0.25, 4.2, true);
      addWall(isLeft ? -12.6 : 12.6, rz, 0.3, 5.0, 4.2, true);
      addWall(doorX, rz - 1.6, 0.25, 1.6, 4.2, true);
      addWall(doorX, rz + 1.6, 0.25, 1.6, 4.2, true);

      const signMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x064e3b
      });
      const signMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.9), signMat);
      signMesh.position.set(doorX, 2.75, rz);
      scene.add(signMesh);

      const bedGroup = new THREE.Group();
      const mattress = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.55, 1.3),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9 })
      );
      mattress.position.y = 0.45;
      const blanket = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.58, 1.32),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
      );
      blanket.position.set(0.3, 0.46, 0);
      bedGroup.add(mattress, blanket);
      bedGroup.position.set(rx, 0, rz);
      scene.add(bedGroup);

      const bedMonsterZone = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 2.2),
        new THREE.MeshBasicMaterial({
          color: 0xdc2626,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide
        })
      );
      bedMonsterZone.rotation.x = -Math.PI / 2;
      bedMonsterZone.position.set(rx, 0.03, rz);
      bedMonsterZone.visible = false;
      scene.add(bedMonsterZone);

      const isVaultRoom = roomNum === 104;
      const posterMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.1, 0.85),
        new THREE.MeshStandardMaterial({ color: isVaultRoom ? 0xf43f5e : 0x38bdf8 })
      );
      posterMesh.position.set(isLeft ? -12.35 : 12.35, 1.75, rz + 1.1);
      scene.add(posterMesh);

      if (isVaultRoom) {
        const vaultMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.75, 0.75),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
        );
        vaultMesh.position.set(isLeft ? -12.42 : 12.42, 1.75, rz + 1.1);
        vaultMesh.visible = false;
        scene.add(vaultMesh);

        game.registerInteractable({
          id: 'secret_poster_vault',
          name: 'Room 104 Wall Poster / Hidden Vault',
          prompt: "Inspect / Break Poster or Unlock Rathew's Vault",
          pos: new THREE.Vector3(isLeft ? -11.8 : 11.8, 1.75, rz + 1.1),
          maxSignDist: 4.5,
          action: () => game.interactWithSecretVault(posterMesh, vaultMesh)
        });
      }

      const roomObj = {
        roomNumber: roomNum,
        pos: new THREE.Vector3(rx, 0, rz),
        doorPos: new THREE.Vector3(doorX, 0, rz),
        signMat,
        bedGroup,
        bedMonsterZone,
        hasBedMonster: false,
        hasCeilingMonster: false,
        ceilingMonsterMesh: null,
        deathRitualActive: false,
        ritualCandles: [],
        ritualTimer: 0,
        patient: null,
        lastPatientMesh: null
      };
      game.wardRooms.push(roomObj);

      game.registerInteractable({
        id: 'ward_room_' + roomNum,
        name: `Room ${roomNum} Ward Bed`,
        prompt: `Assign Patient / Administer Medicine in Room ${roomNum}`,
        pos: new THREE.Vector3(rx, 1.25, rz),
        maxSignDist: 4.2, // Prevents adjacent room signs from overlapping!
        action: () => game.interactWithWardRoom(roomObj)
      });
    }

    // Emergency Wing
    addWall(0, -37, 26, 0.4, 4.2, true);

    const surgeryBoard = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 1.6, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x020617, emissive: 0x0f172a })
    );
    surgeryBoard.position.set(0, 2.5, -36.5);
    scene.add(surgeryBoard);

    for (let e = 0; e < 3; e++) {
      const ex = (e - 1) * 6.5;
      const ez = -32.0;
      const isTopEmergency = e === 1;

      const erBed = new THREE.Mesh(
        new THREE.BoxGeometry(isTopEmergency ? 2.6 : 2.1, 0.6, 1.5),
        new THREE.MeshStandardMaterial({ color: isTopEmergency ? 0xef4444 : 0x0284c7 })
      );
      erBed.position.set(ex, 0.3, ez);
      scene.add(erBed);

      const erObj = {
        id: 'er_' + (e + 1),
        name: isTopEmergency ? 'TOP-LEVEL EMERGENCY SURGERY ROOM' : `Emergency Room ER-${e + 1}`,
        isTopEmergency,
        pos: new THREE.Vector3(ex, 0, ez),
        patient: null,
        timer: 60
      };
      game.emergencyRooms.push(erObj);

      game.registerInteractable({
        id: 'emergency_bed_' + (e + 1),
        name: erObj.name,
        prompt: `Treat / Place Emergency Patient (${erObj.name})`,
        pos: new THREE.Vector3(ex, 1.25, ez),
        isDanger: isTopEmergency,
        action: () => game.interactWithEmergencyRoom(erObj)
      });
    }

    window.GAME_DATA.emergencyItems.forEach((item, idx) => {
      const tx = -5.0 + idx * 2.5;
      const tz = -35.2;
      const table = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.9), counterMat);
      table.position.set(tx, 0.45, tz);
      scene.add(table);

      const itemNode = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.22, 0.32),
        new THREE.MeshStandardMaterial({ color: item.color })
      );
      itemNode.position.set(tx, 1.05, tz);
      scene.add(itemNode);

      game.registerInteractable({
        id: 'er_item_' + item.id,
        name: `${item.icon} ${item.name} (Emergency Table)`,
        prompt: `Pick Up ${item.name} — ${item.desc}`,
        pos: new THREE.Vector3(tx, 1.3, tz),
        action: () => game.pickupMedicine(item)
      });
    });

    // Manager's Office
    const managerDoorMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    game.managerDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.8, 1.8), managerDoorMat);
    game.managerDoorMesh.position.set(5.2, 1.4, -25.5);
    scene.add(game.managerDoorMesh);

    const managerDesk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.95, 1.4), counterMat);
    managerDesk.position.set(9.2, 0.48, -25.5);
    scene.add(managerDesk);

    game.registerInteractable({
      id: 'managers_office',
      name: "Hospital Manager's Office",
      prompt: "Inspect / Enter Manager's Office",
      pos: new THREE.Vector3(5.2, 1.5, -25.5),
      action: () => game.interactWithManagersOffice()
    });

    game.managerBoxMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.55, 0.65),
      new THREE.MeshStandardMaterial({ color: 0xd97706 })
    );
    game.managerBoxMesh.position.set(-2.5, 0.3, 12.5);
    game.managerBoxMesh.visible = false;
    scene.add(game.managerBoxMesh);

    game.registerInteractable({
      id: 'manager_delivery_box',
      name: "Manager's Sealed Mystery Box (Shift 6)",
      prompt: "Pick Up Box for Manager's Office",
      pos: new THREE.Vector3(-2.5, 0.9, 12.5),
      isVisibleFn: () => game.currentShift === 6 && !game.managerOfficeUnlocked && game.heldItem?.id !== 'manager_box',
      action: () => game.pickupManagerBox()
    });

    const discoGeo = new THREE.SphereGeometry(0.85, 20, 20);
    const discoMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.95,
      roughness: 0.05,
      emissive: 0x9333ea
    });
    game.discoBallMesh = new THREE.Mesh(discoGeo, discoMat);
    game.discoBallMesh.position.set(0, 3.3, 8.5);
    game.discoBallMesh.visible = false;
    scene.add(game.discoBallMesh);

    game.ambientLight = new THREE.AmbientLight(0xdbeafe, 0.72);
    scene.add(game.ambientLight);

    const lightPositions = [
      [0, 3.9, 10],
      [0, 3.9, 3],
      [0, 3.9, -5],
      [0, 3.9, -15],
      [0, 3.9, -25],
      [0, 3.9, -32]
    ];

    lightPositions.forEach(([lx, ly, lz]) => {
      const pLight = new THREE.PointLight(0xe0f2fe, 1.15, 19);
      pLight.position.set(lx, ly, lz);
      scene.add(pLight);
      game.ceilingLights.push(pLight);
    });
  }
};
