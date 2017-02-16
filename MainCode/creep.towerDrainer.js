var creep_towerDrainer = {
	run: function(creep) {
		//Should just bounce around on the border healing itself.
		creep.heal(creep);

		if (creep.room.name != creep.memory.destination) {
			creep.moveTo(new RoomPosition(25, 25, creep.memory.destination));
		} else {
			if (creep.hits == creep.hitsMax) {
				creep.moveTo(creep.room.controller);
			} else {
				//Drawing fire
				creep.moveTo(new RoomPosition(25, 25, creep.memory.homeRoom));
			}
		}
	}
};

module.exports = creep_towerDrainer;