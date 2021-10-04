<?php

function generate_filter_form($content_type, $taxonomies = []) {
	wp_enqueue_script( 'taxonomy_filters', get_template_directory_uri() . '/js/filters.js',  [], "", true );
	?>
	
	<div class="filter-form-wrapper filter-<?= $content_type ?>">
		<div class="filter-form-form">
			<form action="<?php echo site_url() ?>/wp-admin/admin-ajax.php" method="POST" id="content_type_filter" data-content-type="<?= $content_type ?>">
			<div class="filter-form-controls-wrapper">
				<div class="filter-form-controls">
					<?php
						foreach($taxonomies as $tax) {
							if( $tax['form_type'] == 'text') {
								echo "<label><span>" . $tax['title'] . "</span>";
								echo "<div class='post-filter-text'>";
									echo '<input class="text-search" type="text"></input>'; 
								echo "</div></label>";
							} elseif($tax['form_type'] == "markup") {
								echo $tax['markup'];
							} else {
								if( $terms = get_terms( [ 'taxonomy' => $tax['tax_name'], 'orderby' => 'name' ] ) ) {
				
									if( $tax['form_type'] == 'select') {
										echo "<div class='tax-filter-select select-{$tax['tax_name']}' data-tax-name='{$tax['tax_name']}' data-affects='{$tax['affects']}'>";
										echo "<label><span>" . $tax['title'] . "</span>";
										echo '<select class="tax-filter"><option value="" class="initial">Select category...</option>';
											foreach ( $terms as $term ) :
												echo '<option  value="' . $term->term_id . '">' . $term->name . '</option>'; 
											endforeach;
										echo '</select>';
										echo '</label>';
										echo '</div>';
									} elseif($tax['form_type'] == 'checkbox') {
										echo "<div class='tax-filter-checkboxes' data-tax-name='{$tax['tax_name']}'>";
											foreach ( $terms as $term ) :
												echo '<label class="checkbox-label"><input class="tax-filter" type="checkbox" value="' . $term->term_id . '"><span>' . $term->name . '</span></input></label>'; 
											endforeach;
										echo "</div>";
									}
								}
							}
						}
					?>
				</div>
				<div class="filter-form-submission-controls">
					<button class='button button-primary filter-apply'>Apply Filter</button>
					<button class='button button-secondary filter-reset'>Reset Filter</button>
				</div>
			</div>
			</form>
		</div>
		<div class="filter-form-results-wrapper">
			<h2 class="looks-like-h4">
				<?php
					$heading = $content_type == "majors" ? "Choose a program to learn more" : "Meet Your Counselor";
					
					echo $heading;
				?>
				
			</h2>
			<div class="response-wrapper response-hidden">
				<div id="response" class="<?= $content_type ?>-wrapper" aria-region="group" aria-label="search results"></div>
				<ul class="pagination-wrapper page-numbers"></ul>
			</div>
		</div>
	</div>
<?php
}

add_action('rest_api_init', function(){

	$acf_data_to_rest_api = [
		[
			"post_type" => "counselors",
			"field_name" => "about"
		],
		[
			"post_type" => "counselors",
			"field_name" => "first_name"
		],
		[
			"post_type" => "counselors",
			"field_name" => "last_name"
		],
		[
			"post_type" => "counselors",
			"field_name" => "photo"
		],
		[
			"post_type" => "counselors",
			"field_name" => "job_title"
		],
		[
			"post_type" => "counselors",
			"field_name" => "contact_url"
		],
		[
			"post_type" => "counselors",
			"field_name" => "meta_key"
		],
		[
			"post_type" => "counselors",
			"field_name" => "meta_value"
		],
		[
			"post_type" => "majors",
			"field_name" => "area_of_study",
			"type" => "taxonomy"
		],
		[
			"post_type" => "majors",
			"field_name" => "college",
			"type" => "taxonomy"
		],
		[
			"post_type" => "majors",
			"field_name" => "learn_more_url"
		],
		[
			"post_type" => "majors",
			"field_name" => "learn_more_text"
		],
		[
			"post_type" => "majors",
			"field_name" => "about"
		],
	];

	foreach($acf_data_to_rest_api as $data) {
		register_rest_field($data['post_type'], $data['field_name'], [
			'get_callback' => function($post) use($data) {
				if($data['type'] === "taxonomy") {
					return wp_get_post_terms($post['id'], $data['field_name']);
				} else {
					return get_field_escaped($data['field_name'], $post['id']);
				}
			}
		]);
	}
	
});


add_filter(
    'rest_counselors_collection_params',
    function( $params ) {
        $params['orderby']['enum'][] = 'last_name';
        return $params;
    },10,1
);

// Manipulate query
add_filter(
    'rest_counselors_query',
    function ( $args, $request ) {
        $order_by = $request->get_param( 'orderby' );
        if ( isset( $order_by ) && 'last_name' === $order_by ) {
            $args['meta_key'] = $order_by;
            $args['orderby']  = 'meta_value'; // user 'meta_value_num' for numerical fields
        }
        return $args;
    },10,2
);


function ugrad_majors_shortcode_fn(){
	ob_start();
	generate_filter_form("majors", [
		["form_type" => "text", "title" => "Search"],
		["tax_name" => "area_of_study", "form_type" => "checkbox", "title" => "Area of Study"],
	]);
	return ob_get_clean();
	
}

add_shortcode("ugrad-majors", "ugrad_majors_shortcode_fn");

function ugrad_counselors_shortcode_fn(){
	ob_start();
	generate_filter_form("counselors", [
		["form_type" => "markup", "markup" => "<div class='form-column'>"],
		
		// ["tax_name"=>"counselor_country", "form_type" => "select", "title" => "Country", "affects" => "counselor_state,counselor_county_in_maryland,counselor_high_school"],
		
		["tax_name"=>"counselor_state", "form_type" => "select", "title" => "State", "affects" => "counselor_county_in_maryland,counselor_high_school"],

		["tax_name"=>"counselor_county_in_maryland", "form_type" => "select", "title" => "County <br><small>(in Maryland)</small>", "affects" => "counselor_high_school"],
		
		["tax_name"=>"counselor_high_school", "form_type" => "select", "title" => "High School <small><br>(in Maryland)</small>","affects"=>""],
		
		["form_type" => "markup", "markup" => "</div>"],
		["tax_name"=>"counselor_tags", "form_type" => "checkbox", "title" => "Tags"],
	]);
	return ob_get_clean();
	
}

add_shortcode("ugrad-counselors", "ugrad_counselors_shortcode_fn");
