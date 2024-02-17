(function(websiteURI) {
    const sprite = vm.runtime.getSpriteTargetByName('host');
    let target = sprite;
    vm.runtime.on("AFTER_EXECUTE", function() {
        Object.values(vm.runtime.targets[0].variables).filter(variable => {
            if (variable.name === 'username') return variable;
        })[0].value = '';
    });
    let allBlocks = Object.values(target.blocks._blocks);

    function getBlockByID(id) {
        return allBlocks.filter(block => {
            if (block.id === id) return block;
        });
    }
    const block = vm.runtime.targets.map(target => {
        return allBlocks.filter(block => {
            if (block.opcode === 'data_setvariableto' && block.fields.VARIABLE.value === 'website name') return block;
        });
    }).filter(blocks => {
        if (blocks.length > 0) return blocks;
    })[0][0];
    const block_join = allBlocks.filter(block => {
        if (block.opcode === 'operator_join') {
            let testBlock = getBlockByID(block.inputs.STRING2.block)[0];
            if (testBlock.fields && testBlock.fields.TEXT && testBlock.fields.TEXT.value === '.ws') return testBlock;
        }
    });

    function deleteBlockByID(id) {
        sprite.blocks.deleteBlock(id);
    }

    function new_SpoofBlock(id, parent, value) {
        return {
            id,
            "opcode": "text",
            "inputs": {},
            "fields": {
                "TEXT": {
                    "name": "TEXT",
                    value
                }
            },
            "next": null,
            "topLevel": false,
            parent,
            "shadow": true
        }
    }
    let blockID = '101010101010101010101';
    deleteBlockByID(block.inputs.VALUE.block);
    deleteBlockByID(block.inputs.VALUE.shadow);
    sprite.blocks._blocks[blockID] = new_SpoofBlock(blockID, block.id, websiteURI);
    block.inputs.VALUE.block = blockID;
    block.inputs.VALUE.shadow = blockID;
    block_join.forEach(block => {
        let testBlock = getBlockByID(block.inputs.STRING2.block)[0];
        testBlock.fields.TEXT.value = '';
    });
})(prompt('Website uri that you want?', 'h@x.com'));
alert('Hack complete register a website with a valid name and your site will appear!');
alert('Pop-Client v2.0\nCreated by Surv.\nhttps://surv.is-a.dev/');