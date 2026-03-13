# LoveThy Master Spine -- Genesis Infrastructure Snapshot

## Purpose

This document represents the Genesis checkpoint of the LoveThy
Neighborhood OS. It captures the architectural philosophy, database
infrastructure, and behavioral design principles that define the system
before full implementation.

------------------------------------------------------------------------

## Core Philosophy

LoveThy exists to strengthen real-world neighbor relationships within
walking distance.

The system is intentionally designed around: - Calm Technology - Local
trust boundaries - Reciprocity between neighbors - Infrastructure-first
design

LoveThy is not an attention marketplace. It is neighborhood
infrastructure.

------------------------------------------------------------------------

## Founder's Clause

LoveThy was created with a simple but profound purpose: to make it
easier for neighbors to care for one another.

Every feature, architectural decision, and business model change must
answer:

"Does this make it easier for neighbors to help each other?"

If a change increases engagement but weakens trust, increases division,
or shifts focus away from neighborly cooperation, it should not be
implemented.

------------------------------------------------------------------------

## Red Line Clause

LoveThy will never implement:

-   Infinite engagement feeds
-   Popularity algorithms
-   Surveillance-based advertising
-   Outrage amplification mechanics
-   Attention-extraction design patterns

The platform must remain a quiet coordination tool for neighbors.

------------------------------------------------------------------------

## Architectural Constitution

### Infrastructure Layer

-   Postgres
-   PostGIS
-   Row Level Security (RLS)

### Trust Boundary

All neighbor interaction is limited to a **0.7‑mile radius (1126
meters)**.

This rule is enforced by database math using PostGIS:
ST_DWithin(location, profile_location, 1126)

### Core Event Engine

Table: `neighborhood_events`

Every interaction is a spatial event:

-   help request
-   lost pet
-   carpool
-   volunteer activity
-   neighborhood event

### Abundance Library

Table: `neighbor_offerings`

Stores optional offerings like:

-   tools
-   skills
-   transportation
-   pet help

### Write Gateway

Function: `create_neighborhood_event()`

Security Definer function ensures: - events are tied to verified profile
location - location spoofing is impossible - expiration defaults apply

### Feed Engine

View: `active_neighborhood_feed`

Filters: - active status - non-expired events - chronological order

### Neighborhood State Machine

Function: `get_neighborhood_state()`

Returns:

-   founder (no neighbors)
-   sparse (1--8 neighbors)
-   atomic (9+ neighbors)

This drives UI transitions.

------------------------------------------------------------------------

## Atomic Density Model

Neighborhood evolution stages:

1 neighbor → Founder Mode\
2 neighbors → Quiet Awareness\
3 neighbors → Network Birth\
10 neighbors → Atomic Density

Atomic Density represents the moment a neighborhood becomes
self-sustaining.

------------------------------------------------------------------------

## Behavioral Design

### First Neighbor Protocol

When a user is alone in a radius, the system acknowledges:

"You are the first neighbor here."

### Split Intent Action

First interaction offers:

-   "I could use a hand"
-   "I'm here to help"

### Inventory of Abundance

The interface reveals neighbor capacity before requests appear.

Example: "34 neighbors within walking distance."

------------------------------------------------------------------------

## Realtime Architecture

Pattern: **Notify → Fetch**

1.  Database change occurs
2.  Realtime signal triggers
3.  Client refetches feed

This keeps websocket traffic minimal.

------------------------------------------------------------------------

## Performance Strategy

Indexes:

-   GIST spatial indexes for location queries
-   Partial index for active events
-   B‑Tree indexes for timeline queries

This ensures feed performance scales as neighborhoods grow.

------------------------------------------------------------------------

## Genesis SQL Infrastructure

The LoveThy database includes:

-   `neighborhood_events` table
-   `neighbor_offerings` table
-   RLS trust boundary policies
-   spatial indexing
-   event creation gateway
-   feed view
-   neighborhood state function

This infrastructure forms the permanent foundation of the LoveThy OS.

------------------------------------------------------------------------

## Development Model

The project maintains two documentation states:

**Master Spine** Locked architectural reference.

**Live Edit** Development branch for iteration.

------------------------------------------------------------------------

## Genesis Declaration

At the moment this document was created, the LoveThy system moved from
concept to deployable infrastructure.

The neighborhood operating system now exists as a functioning database
architecture ready for real-world activation.
