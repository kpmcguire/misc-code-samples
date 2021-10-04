let response_wrapper = document.querySelector(".response-wrapper")
let pagination_wrapper = document.querySelector(".pagination-wrapper")
let pagination_buttons 
let cache = {}
let search_results = document.getElementById("response")
let page = 1
let per_page = 12
let per_page_counselors = 24
let submit_button = document.querySelector(".filter-apply")
let reset_button = document.querySelector(".filter-reset")
let form_action = "init"

let filter_form = document.getElementById("content_type_filter")
let content_type = filter_form.dataset.contentType
let order_by = 'title'

let counselor_query_results = {}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function apply_search_dependencies(el) {
  let el_wrapper = document.querySelector(`.select-${el}`)
  let dependants = el_wrapper.dataset.affects.split(",")
  let el_input = document.querySelector(`.select-${el} select`)

  el_input.addEventListener('change', (el)=>{
    
    // hide the county and high school boxes for any state other than Maryland

    if(el.target.closest(".tax-filter-select").classList.contains("select-counselor_state")) {
      
      let maryland_only_selects = document.querySelectorAll(".select-counselor_county_in_maryland, .select-counselor_high_school")

      if(el.target.options[el.target.selectedIndex].text == "Maryland") {
        maryland_only_selects.forEach(sel=>{
          sel.querySelector('select').removeAttribute("disabled")
        })
      } else {
        maryland_only_selects.forEach(sel=>{
          el.target.closest(".tax-filter-select")
          sel.querySelector('select').setAttribute('disabled', true)
        })
      }
    }

    dependants.forEach(async (dep)=>{

      let wrapper = document.querySelector(`[data-tax-name=${dep}]`);
      
      // if form type is select
      if(wrapper.querySelectorAll('select').length) {
        let dep_select = document.querySelector(`.select-${dep} select`)
        
        // dep_select.removeAttribute("disabled")
        dep_select.value = ""
  
        await do_search('filter')
  
        let dep_options =  dep_select.querySelectorAll("option:not(.initial)")
  
        dep_options.forEach(option => {
          if(counselor_query_results[dep].includes(parseInt(option.value))) {
            option.classList.remove('hidden');
          } else if(option.value == "") {
            option.classList.remove('hidden');
          } else {
            option.classList.add('hidden');
          }
        })
  
        let dep_options_hidden = dep_select.querySelectorAll("option.hidden")
        
        if (dep_options_hidden.length == dep_options.length) {
          dep_select.setAttribute("disabled", true)
        }
      // if form type is checkboxes
      } else if (wrapper.querySelectorAll('input[type="checkbox"]').length) {
        let dep_checkboxes = document.querySelectorAll(`[data-tax-name=${dep}] input[type="checkbox"]`)

        dep_checkboxes.forEach(checkbox=>{
          checkbox.removeAttribute("disabled")
          checkbox.checked = false
        })
  
        await do_search('filter')
    
        dep_checkboxes.forEach(option => {
          if(counselor_query_results[dep].includes(parseInt(option.value))) {
            option.removeAttribute('disabled')
            option.closest('label').classList.remove('hidden');
          } else if(option.value == "") {
            option.removeAttribute('disabled')
            option.closest('label').classList.remove('hidden');
          } else {
            option.setAttribute('disabled', true)
            option.closest('label').classList.add('hidden');
          }
        })
      }
    })
  })

}

if (content_type === 'counselors') {
  order_by = 'last_name'
  per_page = per_page_counselors

  selects_with_dependencies = ['counselor_state', 'counselor_county_in_maryland'];

  selects_with_dependencies.forEach(select=>{
    apply_search_dependencies(select)
  })
}

search_results.setAttribute("aria-live", "polite")
search_results.setAttribute("tabindex", "-1")

function output_results(results, total_pages, action = "") {
    
  if(results.length) {
    counselors_temp = {
      // counselor_state: [],
      counselor_county_in_maryland: [],
      counselor_high_school: [],
    }

    if(action !== "filter") {
      search_results.innerHTML = ""
    }

    results.forEach((result)=>{
      
      if(result.type == 'counselors') {

        // counselors_temp.counselor_state.push(result.counselor_state)
        counselors_temp.counselor_county_in_maryland.push(result.counselor_county_in_maryland)
        counselors_temp.counselor_high_school.push(result.counselor_high_school)
        // counselors_temp.counselor_tags.push(result.counselor_tags)

        if (action !== "filter") {
          counselor_first_name = result.first_name? result.first_name : ""
          counselor_last_name = result.last_name? result.last_name : ""
          
          counselor_title = "<h2 class='looks-like-h4 ugrad-spotlight-title'>" + counselor_first_name + " " +  counselor_last_name + "</h2>" 
        
          counselor_about = result.about? decodeEntities(result.about) : ""
          counselor_job_title = result.job_title? "<h3 class='looks-like-h5'>" + result.job_title + "</h3>" : ""
          counselor_photo = result.photo? result.photo : ""
          counselor_contact_url = result.contact_url? result.contact_url : ""
                  
          let counselor_template = `
            <div class='counselor-wrapper'>
              <div class='ugrad-spotlight is-style-round'>
                <a href="${counselor_contact_url}">
                  <img src="${counselor_photo}" alt="${counselor_title}">
                  <div class='ugrad-spotlight-info'>
                    ${counselor_title}
                    ${counselor_job_title}
                    ${counselor_about}
                    <div class='button button-primary'>Meet with ${counselor_first_name}</div>
                  </div>
                </a>
              </div>
            </div>
          `;

          search_results.innerHTML += counselor_template
        }
      }

      else if(result.type == 'majors') {
        major_url = result.learn_more_url? result.learn_more_url : ""
        
        major_title = result.title? `<h3 class="major-title"><a href="${major_url}">${result.title.rendered}</a></h3>` : ""

        major_area_of_study = result.area_of_study? result.area_of_study : ""
        let major_areas_of_study = "<ul class='list-unstyled major-areas-of-study'>"
        major_area_of_study.forEach(area => {
          major_areas_of_study += (`<li>${area.name}</li>`)
        })
        major_areas_of_study += "</ul>"

        major_college = result.college? result.college : ""
        let major_colleges = "<ul class='list-unstyled major-college'>"
        major_college.forEach(college => {
          major_colleges += (`<li>${college.name}</li>`)
        })
        major_colleges += "</ul>"


        let major_template = `
          <div class='major-wrapper'>
            ${major_title}
            ${major_areas_of_study}
            ${major_colleges}
          </div>
        `;

        search_results.innerHTML += major_template                            
      }
    })
    
    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }

    // counselor_query_results.counselor_state = counselors_temp.counselor_state.flat().filter(onlyUnique)
    counselor_query_results.counselor_county_in_maryland = counselors_temp.counselor_county_in_maryland.flat().filter(onlyUnique)
    counselor_query_results.counselor_high_school = counselors_temp.counselor_high_school.flat().filter(onlyUnique)
    // counselor_query_results.counselor_tags = counselors_temp.counselor_tags.flat().filter(onlyUnique)
    
    let output = ""
    
    if (total_pages > 1) {
      if (page > 1) {
        let to_page = parseInt(page) - 1
        output += `<li><button class="page-numbers prev" data-page="${to_page}">
          <img src='${tax_filter.theme_url}/images/icon-chevron.svg' alt='previous page'>
        </button></li>`
      }
      
      for (var i = 1; i <= total_pages; i++) {
        if (i == page) {
          output += `<li><span class="page-numbers current" data-page="${i}"><span class="sr-only">Go to page </span>${i}</span></li>`
        } else {
          output += `<li><button class="page-numbers" data-page="${i}"><span class="sr-only">Go to page </span>${i}</button></li>`
        }
      }

      if (total_pages > 1 && page < total_pages) {
        let to_page = parseInt(page) + 1
        output += `<li><button class="page-numbers next" data-page="${to_page}">
          <img src='${tax_filter.theme_url}/images/icon-chevron.svg' alt='next page'>
        </button></li>`
      }
       
      pagination_wrapper.innerHTML = output

      pagination_buttons = pagination_wrapper.querySelectorAll('button')
      
      pagination_buttons.forEach(button => {
        button.addEventListener('click', el=>{
          page = el.target.dataset.page

          if (window.innerWidth < 768) {
            search_results.closest(".filter-form-results-wrapper").scrollIntoView({behavior: 'smooth'})
          }
        
          do_search()
        })
      })
    } else {
      pagination_wrapper.innerHTML = ''
    }
  } else {
    search_results.innerHTML = "<p>No results.</p>"
    pagination_wrapper.innerHTML = ''

  }
}

async function request( url, params = {}, action = "", method = 'GET' )  {
  if(action !== "filter") {
    response_wrapper.classList.remove('response-hidden')
  }

  let cacheKey = JSON.stringify( { url, params, method } );
  if ( cache[ cacheKey ] ) {
    output_results( cache[ cacheKey ]);
  }

  let options = {
    method
  };
        
  if ( 'GET' === method ) {
    if (params) {
      // console.log(params)
      url = `${ tax_filter.restBase }/wp/v2/${ url }?` + ( new URLSearchParams( params ) ).toString();
    }
  } else {
    options.body = JSON.stringify( params );
  }
  
  let total_pages
  const result = await fetch( url, options ).then( response => {
    // let total_results = response.headers.get('x-wp-total')
    total_pages = response.headers.get('x-wp-totalpages')
    return response.json()
  });
  cache[ cacheKey ] = result;
  
  if(action !== "filter") {
    response_wrapper.classList.add('response-hidden')
  }

  output_results(result, total_pages, action)  
};

async function do_search(e) {
  
  if (e == "init" || e == "reset") {
  
    let select_filters = document.querySelectorAll('select.tax-filter')
    let checkbox_filters = document.querySelectorAll('.tax-filter-checkboxes')
    let search_term = document.querySelector('.post-filter-text .text-search')

    if(select_filters) {
      select_filters.forEach((filter)=>{
        filter.value = ""
        filter.removeAttribute('disabled')
        filter.querySelectorAll('option').forEach(option=>{
          option.classList.remove('hidden')
        })
      })
    }

    checkbox_filters.forEach((filter)=>{
      tax_checkboxes = filter.querySelectorAll(".tax-filter")
      if (tax_checkboxes.length) {
        tax_checkboxes.forEach((checkbox)=>{
          checkbox.checked = false
          checkbox.removeAttribute('disabled')
          checkbox.closest("label").classList.remove('hidden')
        })
      }
    })

    if(search_term) {
      search_term.value = ""
    }


    let url_params = []
    url_params.push(`orderby=${order_by}`)
    url_params.push('order=asc')
    url_params.push(`per_page=${per_page}`)
    url_params = url_params.join("&")
    cache = "";
    request(content_type, url_params, "")

  } else {
    let select_filters = document.querySelectorAll('.tax-filter-select')
    let checkbox_filters = document.querySelectorAll('.tax-filter-checkboxes')
    let search_term = document.querySelector('.post-filter-text .text-search')
    let url_params = []
    
    url_params.push(`orderby=${order_by}`)
    url_params.push(`order=asc`)
    url_params.push(`per_page=${per_page}`)
    url_params.push(`page=${page}`)

    if(select_filters) {
      // console.log(select_filters)
      select_filters.forEach((filter)=>{
        tax = filter.dataset.taxName
        tax_value = filter.querySelector(".tax-filter").value
  
        if (tax_value) {
          url_params.push(`${tax}=${tax_value}&`)
          url_params.push(`tax_relation=AND`)
        }
      })
    }
  
    if(checkbox_filters) {
      // console.log(checkbox_filters)
      checkbox_filters.forEach((filter)=>{
        tax = filter.dataset.taxName
        tax_checkboxes = filter.querySelectorAll(".tax-filter:checked")
        
        if (tax_checkboxes.length) {
          tax_filters_array = []
          tax_checkboxes.forEach((tax_id)=>{tax_filters_array.push(tax_id.value)})
          tax_filters_string = tax_filters_array.join(",")
          url_params.push(`${tax}=${tax_filters_string}`)
          url_params.push(`page=${page}`)
        }
      })
    }
    
    if(search_term) {
      let term = search_term.value
      url_params.push(`search=${term}`)
    }

    url_params = url_params.join("&")
  
    await request(content_type, url_params, e)

  }
}

submit_button.addEventListener("click", (e)=>{
  e.preventDefault()
  form_action = "submit"
  page = 1
  do_search(form_action)
})

reset_button.addEventListener("click", (e)=>{
  e.preventDefault()
  form_action = "reset"
  page = 1
  do_search(form_action)
})

do_search("init")


