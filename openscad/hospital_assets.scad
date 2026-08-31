// ==========================================================================
// POWERED SMART HOSPITAL (PSH) - PARAMETRIC OPENSCAD SOURCE MODELS
// ==========================================================================

$fn = 60;

// 1. Parametric 3D Medical Cross Emblem
module medical_cross(size=20, depth=5) {
    union() {
        cube([size, size/3, depth], center=true);
        cube([size/3, size, depth], center=true);
    }
}

// 2. Queue Token Node Ring
module queue_token_ring(radius=15, thickness=2) {
    difference() {
        cylinder(r=radius, h=thickness, center=true);
        cylinder(r=radius-thickness, h=thickness+1, center=true);
    }
}

// Render Default Assembly
translate([0, 0, 0]) medical_cross(30, 8);
translate([0, 0, -10]) queue_token_ring(25, 3);
