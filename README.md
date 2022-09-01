# hanabiAnimation
This is the code you can launch Hanabi(fire works) by pressing definite Keys.
Hanabi is launched the canvas(fillRect "black").

To launch, you have to press 1, 2, 3 or Shift Key.

---------------------------------
Regarding the launch position
---------------------------------
The location in canvas launched by pressed Keys↓↓↓
(※Case 1～3, at a random within a specific location...)

Case 1:
  Left egde (about 1/3 part of)

Case 2:
  Center (about 1/3 part of)

Case 3:
  Right edge (about 1/3 part of)

Case Shift Key:
  Random position in canvas


Y position is defined random within 50px from bottom of canvas at launch.
This Animation FrameRate is 60fps.

--------------------------
summary
--------------------------
This Animation is configured 3 Part, the launch, the explosion and the vanishment(fade out).

The First Part, about 3.3s (200frame).
Y-direction movement decrease every frame(defined 4px), so explodes when it reaches 0.

The Next Part, 0.016s (1frame).
The direction and amount of movement of the particles are determined, and they explode.
At this time, about 300 particles are generated.
The gradation is expressed by setting the colors separately for the inner 200 grains and the outer 100 grains.

The Final Part, about 3.3s(200frame).
The generated particles disappear over 200 frames.

