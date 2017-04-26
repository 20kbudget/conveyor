### Current Milestone

#### April 22-27

- * player animation without jumping
- jump to different track tiles
- publish alpha on itch.io
- TDAH Talk about the game
- status updates on blogs

### Task list

- [ ] player
    - [ ] move
        - [ ] update opsition based on current tile / position instead of precalculating all states
        - [x] update player position on enterFrame
        - [x] lineMove state reducer
        - [x] curveMove state reducer
    - [ ] death
        - [ ] check if there is a conveyor on the same base z position
    - [ ] jump
        - [ ] tap listener
        - [ ] global state
        - [ ] animation
- [ ] tracks
    - * [ ] store information about all track tiles (rotation, curves, inputs)
    - [ ] test / implement branch of a branch (nested parenthesis)
- [ ] refactor
    - [ ] replace my vectors/ramda stuff with https://github.com/stackgl/gl-vec3
- [ ] world
    - [ ] regular tick times?
- [ ] tools / debug
    - [ ] CURRENT full track trail print
    - [ ] map editor app
-- [ ] UI?
- [ ] platform-specific
    - [ ] detect support for webgl and display a message when not available

### Future Roadmap

#### After launch

- move more code to the gpu
