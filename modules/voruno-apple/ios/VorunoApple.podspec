Pod::Spec.new do |s|
  s.name           = 'VorunoApple'
  s.version        = '0.1.0'
  s.summary        = 'VORUNO M1 WorkoutKit scheduling experiment'
  s.description   = 'iPhone-only bridge for a fixed test workout; no HealthKit queries.'
  s.author        = 'VORUNO'
  s.homepage      = 'https://github.com/RafaNardo/Voruno.AppleIntegration.PoC'
  s.license       = { :type => 'MIT', :file => '../LICENSE' }
  s.platforms     = { :ios => '17.0' }
  s.source        = { git: 'https://github.com/RafaNardo/Voruno.AppleIntegration.PoC.git' }
  s.swift_version = '5.9'
  s.frameworks    = 'WorkoutKit', 'HealthKit'
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
