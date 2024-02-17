function removeAnticheat() {

//the following code just removes it from every sprite
const targets = vm.runtime.targets;
for (let i = 0; i < targets.length; i++) {
    _removeAnticheat(i);
}

//the actual removal code.
function _removeAnticheat(targetNo) {

    //getting the blocks + stage
	const target = targets[targetNo];
	let allBlocks = Object.values(target.blocks._blocks); 

    //super easy way to get a block via its id
	function getBlockByID(id) {
		return allBlocks.filter(block => {
			if (block.id === id) return block;
		});
	}

    //easier way to get all blocks with a certain opcode
	function getBlocksByOPCODE(type) {
		return allBlocks.filter(block => {
			if (block.opcode === type) return block;
		});
	}

    //helps with deleting blocks
	function deleteBlockByID(id) {
		target.blocks.deleteBlock(id);
	}

    //anticheat checker
    function checkForAnticheat(block) {

        //check if the block is a "get loaded extensions" or a "get all sprites" block.
        function isALoaded(block_) {
            let isLoaderBlock = block_.opcode === 'lmsAssets_getLoadedExtensions';
            isLoaderBlock = block_.opcode === 'lmsAssets_getAllSprites' || isLoaderBlock;
            isLoaderBlock = block_.opcode === 'ShovelUtils_getAllSprites' || isLoaderBlock;

            //penguin mod specific blocks even though it breaks penguin mod
            isLoaderBlock = block_.opcode === 'jgRuntime_getAllSprites' || isLoaderBlock;

            //if it is a "loader" block then return true
            if (isLoaderBlock) {
                return true;
            }
            return false;
        }

        //used to check if the block is or contains a "anticheat" block
        function checkIfBadBlock(_block) {

            if (_block.opcode === 'skyhigh173JSON_json_array_concat') {

                //get the "arrays"
                let arrayBlock1 = getBlockByID(_block.inputs.json.block)[0];
                let arrayBlock2 = getBlockByID(_block.inputs.json2.block)[0];

                //check if any of the blocks are one of the lms loaded blocks
                return isALoaded(arrayBlock1) || isALoaded(arrayBlock2);
            }

            return isALoaded(_block);
        }

        //checking the block
        if (block.opcode === 'skyhigh173JSON_json_equal') {

            //get the blocks
            let block1 = getBlockByID(block.inputs.json1.block)[0];
            let block2 = getBlockByID(block.inputs.json2.block)[0];

            //checking if they are a "bad block"
            return checkIfBadBlock(block1) || checkIfBadBlock(block2);
        } else if (block.opcode === 'operator_equals') {

            //get the blocks
            let block1 = getBlockByID(block.inputs.OPERAND1.block)[0];
            let block2 = getBlockByID(block.inputs.OPERAND2.block)[0];

            //checking if they are a "bad block"
            return checkIfBadBlock(block1) || checkIfBadBlock(block2);
        }

        //if the checks above fail then just assume there is no anticheat
        return false;
    }

    //this function will create a fake text "block"
    function new_SpoofBlock(id, parent) {
        return {
            id,
            "opcode": "text",
            "inputs": {}, 
            "fields": {
                "TEXT": {
                    "name": "TEXT",
                    "value": "{}"
                }
            },
            "next": null,
            "topLevel": false,
            parent,
            "shadow": true
        }
    }

    //gets all text inputs
	let filteredBlocks = getBlocksByOPCODE('skyhigh173JSON_json_equal').concat(getBlocksByOPCODE('operator_equals'));

    //going over all found blocks
	filteredBlocks.forEach(block => {

        //saving the block to modify it
		let save = structuredClone(block);
        if (!save.parent) save.topLevel = true;

            //check for basic anticheat
            if (!checkForAnticheat(block)) return;

            //Checks if the block is the json equal so I can save the equal block
            if (block.opcode === 'skyhigh173JSON_json_equal') {
                var equalMenu = getBlockByID(block.inputs.equal.block)[0];
                if (!equalMenu) return;
            }
            deleteBlockByID(block.id);

            //making some fake id's
            const spoofId = '00000000000000000000';
            var spoof1 = spoofId+'1';
            var spoof2 = spoofId+'2';

            //making the fake blocks and adding them to the actual blocks area
            target.blocks._blocks[spoof1] = new_SpoofBlock(spoof1, save.id);
            target.blocks._blocks[spoof2] = new_SpoofBlock(spoof2, save.id);

            if (save.opcode === 'skyhigh173JSON_json_equal') {

                //overriding the block id used, as 1 its deleted duh, and 2 were going to make our own
                save.inputs.json1.block = spoof1; //using fake id
                save.inputs.json2.block = spoof2; //using fake id
                save.inputs.json1.shadow = spoof1; //using fake id
                save.inputs.json2.shadow = spoof2; //using fake id

                //Add back the equal menu
                target.blocks._blocks[equalMenu.id] = equalMenu;
            } else if (save.opcode === 'operator_equals') {

                //overriding the block id used, as 1 its deleted duh, and 2 were going to make our own
                save.inputs.OPERAND1.block = spoof1; //using fake id
				save.inputs.OPERAND2.block = spoof2; //using fake id
                save.inputs.OPERAND1.shadow = spoof1; //using fake id
				save.inputs.OPERAND2.shadow = spoof2; //using fake id
            }
            
            //adding back the "parent"
            target.blocks._blocks[save.id] = save;

	});
	//return filteredBlocks;
}};removeAnticheat();