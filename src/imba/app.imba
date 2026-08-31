# ==========================================================================
# POWERED SMART HOSPITAL (PSH) - IMBA SOURCE COMPONENT DEFINITION
# ==========================================================================

tag app-header
	def render
		<header.site-header>
			<a.brand-logo href="#home">
				<div.brand-icon> "+"
				<span> "PSH | Smart Hospital"
			<div.role-switcher>
				<button.role-btn bind=role> "Patient"
				<button.role-btn bind=role> "Receptionist"
				<button.role-btn bind=role> "Doctor"

tag token-card
	prop token
	prop room
	prop state

	def render
		<div.now-serving-box>
			<p> "ACTIVE QUEUE TOKEN"
			<div.token-display-number> token
			<p.token-room-number> "Room {room} • Status: {state}"
