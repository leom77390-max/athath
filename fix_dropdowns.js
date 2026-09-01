const fs = require('fs');

const path = 'twilight.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const component = data.components.find(c => c.path === 'home.hero-special');

function processFields(fields) {
    if (!fields) return;
    for (let field of fields) {
        if (field.format === 'dropdown-list' && field.value !== undefined) {
            const matchingOption = field.options.find(opt => opt.value === field.value);
            if (matchingOption) {
                field.selected = [ matchingOption ];
                delete field.value;
            }
        }
        
        if (field.fields) {
            processFields(field.fields);
        }
    }
}

if (component) {
    processFields(component.fields);
    fs.writeFileSync(path, JSON.stringify(data, null, 4));
    console.log('Modified successfully.');
} else {
    console.log('Component not found.');
}
