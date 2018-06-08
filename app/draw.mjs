import * as d3 from "d3";

export {drawTree, resetTree};

function drawTree({
    svg,
    tree,
    totalSamples,

    maxDepth = Number.POSITIVE_INFINITY,
    lengthDelta = 0.85, // Length delta (factor)
    branchStrategy: _branchStrategy = "SIMPLE",

    branchColor: _branchColor = "IMPURITY",
    branchThickness: _branchThickness = "SAMPLES",
    leafColor: _leafColor = "IMPURITY",
    leafSize: _leafSize = "SAMPLES",
}) {
    const {
        branches,
        leafs
    } = generateTreeElements(tree, totalSamples, lengthDelta, maxDepth, branchStrategy(_branchStrategy));

    // Draw branches
    svg.selectAll('line')
        .data(branches)  // This is where we feed the data to the visualization
        .enter()
        .append('line')
        .attr('x1', d => d.x)
        .attr('y1', d => d.y)
        .attr('x2', d => d.x2)
        .attr('y2', d => d.y2)
        .style('stroke-width', d => branchThickness(d, _branchThickness, totalSamples))
        .style('stroke', d => branchColor(d, _branchColor))
        .attr('id', d => 'branch-' + d.index);  // This attr is currently not used

    // Draw leafs
    svg.selectAll('circle')
        .data(leafs)  // This is where we feed the data to the visualization
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => leafSize(d, _leafSize, totalSamples))
        .style("fill", d => leafColor(d, _leafColor));
}

function resetTree(svg) {
    svg.selectAll('line').remove();
    svg.selectAll('circle').remove();
}

function generateTreeElements(tree, totalSamples, lengthDelta, maxDepth, strategy) {
    const branches = [];
    const leafs = [];

    // Helper functions
    const addBranchInformation = (treeNode, index, x, y, angle, length, depth, parent) => {
        return Object.assign(treeNode, {
            index,
            x,
            y,
            x2: x + length * Math.sin(angle),
            y2: y - length * Math.cos(angle),
            angle,
            length,
            depth,
            parent
        })
    };

    const removeChildReferences = (node) => {
        const nodeCopy = Object.assign({}, node);
        delete nodeCopy.children;
        return nodeCopy;
    };

    // recursive function that adds branch objects to "branches"
    function branch(node) {
        branches.push(removeChildReferences(node));

        if (node.children.length === 0 || node.depth === maxDepth - 1) {
            leafs.push({
                x: node.x2,
                y: node.y2,
                impurity: node.impurity,
                samples: node.samples
            });
            return;  // End of recursion
        }

        const {leftChild, rightChild} = strategy(node);
        //const length = node.length * lengthDelta;
        const length1 = 4 + leftChild.samples / totalSamples * 100;
        const length2 = 4 + rightChild.samples / totalSamples * 100;

        const angle1 = node.angle - Math.abs(leftChild.samples / node.samples - 1);
        const angle2 = node.angle + Math.abs(rightChild.samples / node.samples - 1);

        if (leftChild !== undefined) {
            branch(addBranchInformation(leftChild, branches.length, node.x2, node.y2, angle1, length1, node.depth + 1, node.index));
        }
        if (rightChild !== undefined) {
            branch(addBranchInformation(rightChild, branches.length, node.x2, node.y2, angle2, length2, node.depth + 1, node.index));
        }
    }

    // Start parameters: Index=0; starting point at 500,600 (middle of bottom line); 0° angle; 100px long; no parent branch
    const baseNode = addBranchInformation(tree.baseNode, 0, 400, 800, 0, 100, 0, null);
    branch(baseNode);

    return {branches, leafs};
}

// Tree construction strategies
function branchStrategy(type) {
    if (type === "SIMPLE") {
        return node => {
            const leftChild = node.children[0];
            const rightChild = node.children[1];
            return {leftChild, rightChild};
        };
    } else if (type === "UP") {
        return node => {
            const firstBiggerThanSecond = (node.children[0].samples / node.samples) >= 0.5;
            const leftBound = node.angle < 0;
            let leftChild, rightChild;
            if (firstBiggerThanSecond && leftBound) {
                leftChild = node.children[1];
                rightChild = node.children[0];
            } else if (!firstBiggerThanSecond && leftBound) {
                leftChild = node.children[0];
                rightChild = node.children[1];
            } else if (firstBiggerThanSecond && !leftBound) {
                leftChild = node.children[0];
                rightChild = node.children[1];
            } else {
                leftChild = node.children[1];
                rightChild = node.children[0];
            }
            return {leftChild, rightChild};
        };
    }
    console.log(this);
    throw "Unsupported setting";
}

/* ------- Tree mapping functions ------- */

function branchColor(branch, type) {
    if (type === "IMPURITY") {
        // Linear scale that maps impurity values from 0 to 1 to colors from "green" to "brown"
        return d3.scaleLinear()
            .domain([0, 1])
            .range(["green", "brown"])
            (branch.impurity);
    }
    console.log(this);
    throw "Unsupported setting";
}

function branchThickness(branch, type, totalSamples) {
    if (type === "SAMPLES") {
        // Linear scale that maps the number of samples in a branch to a certain number of pixels
        return d3.scaleLinear()
            .domain([1, totalSamples])
            .range([1, 15])
            (branch.samples) + 'px';
    }
    console.log(this);
    throw "Unsupported setting";
}

function leafColor(leaf, type) {
    if (type === "IMPURITY") {
        if (leaf.impurity > 0.5) {
            return "red";
        } else {
            return d3.scaleLinear()
                .domain([0, 0.5])
                .range(["green", "red"])
                (leaf.impurity);
        }
    }
    console.log(this);
    throw "Unsupported setting";
}

function leafSize(leaf, type, totalSamples) {
    const maxRadius = Math.sqrt(totalSamples / Math.PI);
    const radius = Math.sqrt(leaf.samples / Math.PI);
    if (type === "SAMPLES") {
        return d3.scaleLinear()
            .domain([1, maxRadius])
            .range([1, 100])
            (radius)
    }
    console.log(this);
    throw "Unsupported setting";
}