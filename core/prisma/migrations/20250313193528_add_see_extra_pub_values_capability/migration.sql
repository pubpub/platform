-- AlterEnum
ALTER TYPE "Capabilities" ADD VALUE 'seeExtraPubValues';
COMMIT;

INSERT INTO
    "membership_capabilities"
VALUES
    (
        'editor'::"MemberRole",
        'pub'::"MembershipType",
        'seeExtraPubValues'::"Capabilities"
    ),
    (
        'admin'::"MemberRole", 
        'pub'::"MembershipType", 
        'seeExtraPubValues'::"Capabilities"
    );