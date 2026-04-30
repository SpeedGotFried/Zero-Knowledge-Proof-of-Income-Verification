pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/comparators.circom";

template IncomeCheck() {
    // Private input
    signal input salary;
    
    // Public input
    signal input threshold;
    
    // Public output
    signal output is_valid;

    // We want to prove salary >= threshold
    // GreaterEqThan(n) where n is the number of bits. 
    // Assuming salary and threshold fit in 64 bits.
    component geq = GreaterEqThan(64);
    
    geq.in[0] <== salary;
    geq.in[1] <== threshold;
    
    // Output 1 if true, 0 if false.
    // This allows proof generation to always succeed.
    is_valid <== geq.out;
}

// Instantiate the component with `threshold` as public input
component main {public [threshold]} = IncomeCheck();
